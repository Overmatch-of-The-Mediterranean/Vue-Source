import { ShapeFlags } from "packages/shared/src/shapeFlags"
import { Comment, Fragment, Text, VNode, createVNode, isSameVNodeType } from "./vnode"
import { patchProp } from "packages/runtime-dom/src/patchProp"
import { EMPTY_OBJ, isString } from "@vue/shared"

interface RendererOptions { 
    insert(child:Element,parent:Element,anchor): void
    createElement(tag:string): Element
    setElementText(el: Element, text: string): void
    patchProp(el: Element, key: string, preValue, newValue): void,
    remove(child: Element): void,
    createText(value: string): any,
    createComment(value: string): any,
    setText(vnode,text):any
}
 


export function createRenderer(options: RendererOptions) {
    return baseCreateRenderer(options)
}
 
function baseCreateRenderer(options: RendererOptions) { 

    const { 
        insert: hostInsert,
        createElement: hostCreateElement,
        setElementText: hostSetElementText,
        patchProp: hostPatchProp,
        remove: hostRemove,
        createText: hostCreateText,
        createComment: hostCreateComment,
        setText: hostSetText
    } = options
    
    // 挂载
    const mountElement = (vnode, container, anchor) => { 
        const { type, shapeFlag,props } = vnode
        // 1.创建DOM元素
        const el = vnode.el = hostCreateElement(type)
        // 2.设置DOM的文本
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) { 
            hostSetElementText(el,vnode.children)
         }
        // 3.处理props
        if (props) { 
            for (const key in props) { 
                hostPatchProp(el,key,null,props[key])
             }
         }
        // 4.插入
        hostInsert(el,container,anchor)
     }

    const patchElement = (oldVNode, newVNode) => { 
        const el = (newVNode.el = oldVNode.el)
        const oldProps = oldVNode.props || EMPTY_OBJ
        const newProps = newVNode.props || EMPTY_OBJ

        // 更新children
        patchChildren(oldVNode,newVNode,el,null)

        // 更新props
        patchProps(el,newVNode,oldProps,newProps)

    }
    
    const mountChildren = (children, container, anchor) => { 
        if (isString(children)) { 
            children = children.split('')
        }
        
        for (let i = 0; i < children.length; i++) { 
            const child = (children[i] = normalizeVNode(children[i]))
            patch(null,child,container,anchor)
         }
    }
    
    const normalizeVNode = (child) => { 
        if (typeof child === 'object') {
            return cloneIfMounted(child)
        } else { 
            return createVNode(Text,null,String(child))
         }
    }
    
    const cloneIfMounted = (child) => { 
        return child
     }

    const patchChildren = (oldVNode, newVNode,container,anchor) => { 
        
        // 获取新旧vnode的children和shapeFlag
        const c1 = oldVNode && oldVNode.children
        const  oldShapeFlag  = oldVNode && oldVNode.shapeFlag
        const c2 = newVNode.children
        const { shapeFlag } = newVNode

        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // TODO 卸载操作
            }
            
            if (c2 !== c1) {
                hostSetElementText(container, c2)
            }
        } else { 
            if (oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    // TODO diff
                } else {
                    // TODO 卸载操作    
                }
            } else { 
                if (oldShapeFlag & ShapeFlags.TEXT_CHILDREN) { 
                    hostSetElementText(container, '')
                }
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { 
                    // 单独挂载
                    // mountElement(c2,container,null)
                 }
                
             }
         }
     }

    const patchProps = (el:Element,vnode,oldProps, newProps) => { 

        // 属性的修改和添加
        if (oldProps !== newProps) { 
            for (const key in newProps) { 
                const prev = oldProps[key]
                const next = newProps[key]

                if (prev !== next) { 
                    hostPatchProp(el,key,prev,next)
                 }
             }
        }
        
        // 清除newProps上没有的旧属性
        if (oldProps !== EMPTY_OBJ) {
            for (const key in oldProps) { 
                if (!(key in newProps)) { 
                    hostPatchProp(el, key, oldProps[key],null)
                 }
             }
        }
        
        
     }
    
    const processElement = (oldVNode, newVNode, container, anchor) => { 
        
        if (oldVNode == null) {
            mountElement(newVNode, container, anchor)
        } else { 
            // TODO 更新
            patchElement(oldVNode,newVNode)
        }
    }
    
    // 文本类型VNode的挂载和更新
    const processText = (oldVNode, newVNode, container, anchor) => { 
        if (oldVNode == null) {
            // 挂载操作
            hostInsert((newVNode.el = hostCreateText(newVNode.children)),container,anchor)
        } else { 
            const el = (newVNode.el = oldVNode.el!)
            // 更新操作
            if (oldVNode.children !== newVNode.children) { 
                hostSetText(el, newVNode.children)
             }
            
         }      
     }
    
    // 注释类型VNode的挂载和更新
    const processCommentNode = (oldVNode, newVNode, container, anchor) => { 
        if (oldVNode == null) {
            hostInsert(newVNode.el = hostCreateComment(newVNode.children),container,anchor)
        } else { 
            newVNode.el = oldVNode.el
         }
     }

    // Fragment的挂载和更新
    const processFragment = (oldVNode, newVNode, container, anchor) => { 
        if (oldVNode == null) {
            mountChildren(newVNode.children,container,anchor)
        } else { 
            patchChildren(oldVNode,newVNode,container,anchor)
         }
     }
    
    
    
    const patch = (oldVNode, newVNode, container, anchor = null) => { 
        // debugger
        if (oldVNode === newVNode) { 
            return
        }
        
        // 不同元素的处理逻辑
        if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) { 
            unmount(oldVNode)
            oldVNode = null
         }

        const { type, shapeFlag } = newVNode

        switch (type) { 
            case Text:
                processText(oldVNode,newVNode,container,anchor)
                break
            case Comment:
                processCommentNode(oldVNode,newVNode,container,anchor)
                break
            case Fragment:
                processFragment(oldVNode,newVNode,container,anchor)
                break
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(oldVNode, newVNode, container, anchor)
                } else if (shapeFlag & ShapeFlags.COMPONENT) { }
         }
     }
    
    // 卸载
    const unmount = (vnode) => { 
        hostRemove(vnode.el)
     }
    
    const render = (vnode, container) => { 
        if (vnode == null) {
            // TODO卸载
            unmount(container._vnode)
        } else { 
            patch(container._vnode || null, vnode, container)
        }
        
        container._vnode = vnode
     }

    return { 
        render
     }
}