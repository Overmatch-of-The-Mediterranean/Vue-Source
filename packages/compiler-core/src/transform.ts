import { isArray, isString } from "@vue/shared"
import { NodeTypes } from "./ast"
import { isSingleElementRoot } from "./hoistStatic"
import { TO_DISPLAY_STRING } from "./runtimeHelpers"


export interface TransformContext { 
    root
    parent: ParentNode | null
    childrenIndex: number
    currentNode
    helpers: Map<symbol, number>,
    helper<T extends symbol>(name: T): T
    nodeTransforms: any[],
    replaceNode(node):void
 }

 
export function createTransformContext(root, { nodeTransforms }) { 
    const context: TransformContext = {
        nodeTransforms,
        root,
        helpers: new Map(),
        currentNode:root,
        parent: null,
        childrenIndex: 0,
        helper(name) { 
            const count = context.helpers.get(name) || 0
            context.helpers.set(name, count + 1)
            return name
        },
        replaceNode(node) {
            context.parent!.children[context.childrenIndex] = context.currentNode = node
        }
        
    }

    return context
}

/**
 * 1.深度优先，tranverseNode和tranverseChildren实现
 * 2.转换
 *  transformElement主要生成codegenNode和helpers
 *  transformText实现将相邻的文本节点和表达式合并为一个表达式
 * 3.context上下文
 */
 
export function transform(root, options) { 
    const context = createTransformContext(root, options)

    tranverseNode(root, context)
    
    createRootCodegen(root)

    root.helpers = [...context.helpers.keys()]
    root.components = []
    root.directives = []
    root.imports = []
    root.hoists = []
    root.temps = []
    root.cached = []
}



export function tranverseNode(node,context:TransformContext) { 
    context.currentNode = node

    const { nodeTransforms } = context

    const exitFns:any[] = []

    for (let i = 0; i < nodeTransforms.length; i++) {
        const onExit = nodeTransforms[i](node, context);
        if (onExit) { 
            if (isArray(onExit)) {
                exitFns.push(...onExit)
            } else {
                exitFns.push(onExit)
            }
        }
        
        if (!context.currentNode) {
            return
        } else {
            node = context.currentNode
        }

    }

    switch (node.type) {
        case NodeTypes.IF_BRANCH:
        case NodeTypes.ELEMENT:
        case NodeTypes.ROOT:
            tranverseChildren(node,context)
            break;
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING)
            break
        case NodeTypes.IF:
            for (let i = 0; i < node.branches.length; i++) {
                tranverseNode(node.branches[i], context)
            }
            break
            
    }


    context.currentNode = node
    let i = exitFns.length
    while (i--) { 
        exitFns[i]()
     }
}
 
export function tranverseChildren(parent, context: TransformContext) { 
    parent.children.forEach((node, index) => { 
        context.parent = parent
        context.childrenIndex = index
        tranverseNode(node,context)
    })
 }
 
function createRootCodegen(root) { 
    const { children } = root

    // Vue2仅支持单个根节点
    if (children.length === 1) { 
        const child = children[0]
        if (isSingleElementRoot(root,child) && child.codegenNode) {
            root.codegenNode = child.codegenNode
        }
     }


    // Vue3支持多个根节点
 }

export function createStructuralDirectiveTransform(name: string | RegExp, fn) {
    const matches = isString(name)
        ? (n: string) => n === name
        : (n: string) => (name as RegExp).test(n)
    
    return (node, context) => {
        // 只去处理和element相关的指令
        if (node.type === NodeTypes.ELEMENT) {
            const props = node.props
            const exitFns: any[] = []
            
            // 构建exitFns
            for (let i = 0; i < props.length; i++) {
                const prop = props[i]
                // 对于prop而言，只去处理指令
                if (prop.type === NodeTypes.DIRECTIVE && matches(prop.name)) {
                    props.splice(i, 1)
                    i--
                    const onExit = fn(node, prop, context)
                    if (onExit) {
                        exitFns.push(onExit)
                    }
                }
            }


            return exitFns
        }
    }
 }