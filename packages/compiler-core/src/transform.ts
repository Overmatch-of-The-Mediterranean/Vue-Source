import { NodeTypes } from "./ast"
import { isSingleElementRoot } from "./hoistStatic"


export interface TransformContext { 
    root
    parent: ParentNode | null
    childrenIndex: number
    currentNode
    helpers: Map<symbol, number>,
    helper<T extends symbol>(name: T): T
    nodeTransforms:any[]
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
            exitFns.push(onExit)
         }
        
    }

    switch (node.type) {
        case NodeTypes.ELEMENT:
        case NodeTypes.ROOT:
            tranverseChildren(node,context)
            break;
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
