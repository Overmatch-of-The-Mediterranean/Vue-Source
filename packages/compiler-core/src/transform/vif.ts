import { isString } from "@vue/shared";
import { NodeTypes, createCallExpression, createConditionalExpression, createObjectProperty, createSimpleExpression } from "../ast";
import { TransformContext, createStructuralDirectiveTransform } from "../transform";
import { getMemoedVNodeCall } from "../utils";
import { CREATE_COMMENT } from "../runtimeHelpers";

export const transformIf = createStructuralDirectiveTransform(
    /^(if|else|else-if)/,
    (node, dir, context) => {
        // 返回的这个函数是onExit
        return processIf(node, dir, context, (ifNode, branch,
            isRoot) => {
            let key = 0

            // 通过这个函数来去构建codegen
            return () => {
                // 给ifNode加上codegenNode
                if (isRoot) {
                    ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context)
                }
            }
        }) 
    }
)

// processIf是真正处理if指令的代码
export function processIf(node,
    dir,
    context: TransformContext,
    processCodegen?: (node, branch, isRoot:boolean) => (() => void) // 给节点增加codegen属性
) {
    if (dir.name === 'if') {
        const branch = createIfBranch(node, dir)

        const ifNode = {
            type: NodeTypes.IF,
            loc: {},
            branches:[branch]
        }

        context.replaceNode(ifNode)

        if (processCodegen) {
            return processCodegen(ifNode, branch, true)
        }

    }

}

function createIfBranch(node, dir) {
    return {
        type: NodeTypes.IF_BRANCH,
        loc: {},
        condition: dir.exp,
        children:[node]
    }
}


function createCodegenNodeForBranch(branch, keyIndex, context: TransformContext) {
    if (branch.condition) {
        return createConditionalExpression(
            branch.condition,
            createChildrenCodegenNode(branch, keyIndex),
            createCallExpression(context.helper(CREATE_COMMENT),
            ['"v-if"','true'])
        )
    } else {
        return createChildrenCodegenNode(branch, keyIndex)
    }
    
    // return {}
}


// 创建指定子节点的codegen
function createChildrenCodegenNode(branch, keyIndex: number) {
    const keyProperty = createObjectProperty(`key`, createSimpleExpression(`${keyIndex}`, false)) // 创建对象的属性节点
    

    const { children } = branch
    const firstChild = children[0]
    const ret = firstChild.codegenNode
    const vnodeCall = getMemoedVNodeCall(ret)

    // 利用keyProperty去填充props
    injectProp(vnodeCall, keyProperty)

    return ret
}

export function injectProp(node, prop) {
    let propsWithInjection

    let props = node.type === NodeTypes.VNODE_CALL ? node.props : node.arguments[2]
    
    if (props === null || isString(props)) {
        propsWithInjection = createObjectExpression([prop])
    }
    node.props = propsWithInjection
}

export function createObjectExpression(properties) {
    return {
        type: NodeTypes.JS_OBJECT_EXPRESSION,
        loc: {},
        properties
    }
}


