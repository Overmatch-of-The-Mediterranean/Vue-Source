import { ShapeFlags } from "packages/shared/src/shapeFlags"
import { Comment, Fragment, Text, VNode, createVNode, isSameVNodeType, normalizeVNode } from "./vnode"
import { patchProp } from "packages/runtime-dom/src/patchProp"
import { EMPTY_OBJ, isString } from "@vue/shared"
import { createComponentInstance, setupComponent } from "./component"
import { ReactiveEffect } from "packages/reactivity/src/effect"
import { queuePreFlushCb } from "./scheduler"
import { renderComponentRoot } from "./componentRenderUtils"
import { createAppAPI } from "./apiCreateApp"

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
    

    const setupRenderEffect = (instance,initialVNode,container,anchor)=>{
        const componentUpdateFn = () => { 
            if (!instance.isMounted) {
                // 组件挂载
                const { bm, m } = instance
                const subTree = instance.subTree = renderComponentRoot(instance)
                console.log('subTree',subTree);
                

                if (bm) {
                    bm()
                }

                patch(null, subTree, container, anchor)
                
                if (m) {
                    m()
                }

                initialVNode.el = subTree.el
                instance.isMounted = true
            } else { 
                // 组件更新
                let { next, vnode } = instance

                if (!next) { 
                    next = vnode
                }
                
                const nextTree = renderComponentRoot(instance)

                const preTree = instance.subTree
                instance.subTree = nextTree

                patch(preTree, nextTree, container, anchor)

                next.el = nextTree.el
                
             }

         }

        const effect = instance.effect = new ReactiveEffect(
            componentUpdateFn,
            () => queuePreFlushCb(update)
        )

        const update = instance.update = () => effect.run()

        update()

     }

    const mountComponent = (initialVNode, container, anchor) => { 
        // 创建组件实例
        initialVNode.component = createComponentInstance(initialVNode)
        const instance = initialVNode.component

        // 组件实例上添加render
        setupComponent(instance)

        // 组件实例渲染
        setupRenderEffect(instance,initialVNode,container,anchor)

     }

    // 挂载
    const mountElement = (vnode, container, anchor) => { 
        const { type, shapeFlag,props } = vnode
        // 1.创建DOM元素
        const el = vnode.el = hostCreateElement(type)
        // 2.设置DOM的文本
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, vnode.children)
        } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) { 
            mountChildren(vnode.children,el,null)
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
    
    // diff算法核心
    const patchKeyedChildren = (oldChildren, newChildren, container, parentAnchor) => {

        let i = 0
        const newChildrenLength = newChildren.length
        let oldChildrenEnd = oldChildren.length - 1
        let newChildrenEnd = newChildrenLength - 1


        // 1.从前往后
        while (i <= oldChildrenEnd && i <= newChildrenEnd) {
            console.log('one',i);
            const oldVNode = oldChildren[i]
            const newVNode = newChildren[i]

            
            
            if (isSameVNodeType(oldVNode, newVNode)) {
                patch(oldVNode, newVNode, container, parentAnchor)
            } else {
                break
            }
            i++
        }

        // 2.从后往前
        while (i <= oldChildrenEnd && i <= newChildrenEnd) {
            console.log('two',i);
            const oldVNode = oldChildren[oldChildrenEnd]
            const newVNode = newChildren[newChildrenEnd]

            if (isSameVNodeType(oldVNode, newVNode)) {
                patch(oldVNode, newVNode, container, parentAnchor)
            } else {
                break
            }
            oldChildrenEnd--
            newChildrenEnd--

            
        }

        // 3.newChildren比oldChildren多
        if (i > oldChildrenEnd) {
            if (i <= newChildrenEnd) {
                const nextpos = newChildrenEnd + 1
                const anchor = nextpos < newChildrenLength ? normalizeVNode(newChildren[nextpos]).el : null
                while (i <= newChildrenEnd) {
                    patch(null, newChildren[i], container, anchor)
                    i++
                }
            }
        }
        // 4.newChildren比oldChildren少
        else if (i > newChildrenEnd) {
            while (i <= oldChildrenEnd) {
                unmount(oldChildren[i])
                i++
            }
        }
            
        // 5.乱序
        else { 
            // debugger
            const s1 = i // prev starting index
            const s2 = i // next starting index

            // 5.1 build key:index map for newChildren
            // 建立newChildren中child的key所对应的index索引

            const keyToNewIndexMap: Map<string | number | symbol, number> = new Map()
            for (i = s2; i <= newChildrenEnd; i++) { 
                const nextChild = normalizeVNode(newChildren[i])
                if (nextChild.key != null) { 
                    keyToNewIndexMap.set(nextChild.key,i)
                 }
            }
            
            // 5.2 遍历oldChildren，进行patch和unmount操作
            let j
            let patched = 0
            const toBePatched = newChildrenEnd - s2 + 1
            let moved = false
            let maxNewIndexSoFar = 0

            const newIndexToOldIndexMap = new Array(toBePatched)
            for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0
            
            for (i = s1; i <= oldChildrenEnd; i++) { 
                const prevChild = oldChildren[i]

                if (patched >= toBePatched) { 
                    unmount(prevChild)
                    continue
                }
                
                let newIndex
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key)
                } else { 
                    for (j = s2; j <= newChildrenEnd; j++) { 
                        if (
                            newIndexToOldIndexMap[j - s2] === 0 &&
                            isSameVNodeType(prevChild, newChildren[j])
                        ) { 
                            newIndex = j
                            break
                            }
                     }
                }
                
                if (newIndex === undefined) {
                    unmount(prevChild)
                } else { 
                    newIndexToOldIndexMap[newIndex - s2] = i + 1
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex
                    } else { 
                        moved = true
                    }
                    
                    patch(prevChild, newChildren[newIndex], container, null)
                    patched++
                 }
             }

            // 5.3 移动和挂载

            // 最长递增子序列
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : []

            j = increasingNewIndexSequence.length - 1

            for (i = toBePatched - 1; i >= 0; i--) { 
                const nextIndex = s2 + i
                const nextChild = newChildren[nextIndex]
                const anchor = nextIndex + 1 < newChildrenLength ? newChildren[nextIndex + 1].el : parentAnchor
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, anchor)
                } else if (moved) { 
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        move(nextChild, container, anchor)
                    } else { 
                        j--
                    }
                 }
             }
         }
        
     }

    const move = (vnode,container,anchor) => { 
        const { el } = vnode

        hostInsert(el!, container, anchor)
    }

    const patchChildren = (oldVNode, newVNode,container,anchor) => { 
        
        // 获取新旧vnode的children和shapeFlag
        const c1 = oldVNode && oldVNode.children
        const  oldShapeFlag  = oldVNode ? oldVNode.shapeFlag : 0
        const c2 = newVNode && newVNode.children
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
                    
                    patchKeyedChildren(c1,c2,container,anchor)
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
    
    const processComponent = (oldVNode, newVNode, container, anchor) => { 
        if (oldVNode == null) { 
            mountComponent(newVNode, container, anchor)
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
                } else if (shapeFlag & ShapeFlags.COMPONENT) { 
                    processComponent(oldVNode, newVNode, container ,anchor)
                }
         }
     }
    
    // 卸载
    const unmount = (vnode) => { 
        hostRemove(vnode.el)
     }
    
    const render = (vnode, container) => { 
        // debugger
        if (vnode == null) {
            // TODO卸载
            unmount(container._vnode)
        } else { 
            patch(container._vnode || null, vnode, container)
        }
        
        container._vnode = vnode
     }

    return { 
        render,
        createApp: createAppAPI(render)
     }
}


// 得到最长递增子序列
function getSequence (arr:number[]):number[] {
    const p = arr.slice()
    const result = [0]
    let i, j, u, v, c
    const len = arr.length


    for (i = 0; i < len; i++) {
        const arrI = arr[i]
        // 1.判断新元素是否比递增子序列最后一个索引对应的元素要大
        // 如果大，则在result中记录该元素的索引
        // 否则，进行二分查找
        if (arrI !== 0) {
            j = result[result.length - 1]
            if (arr[j] < arrI) {
                p[i] = j
                result.push(i)
                continue
            }

            // 2.二分查找
            // 因为新元素比result最后一个索引对应的元素值要小
            // 所以，要二分查找到result中，最后一个索引之前的所有对应的元素中，比新元素大的中的最小元素
            // 找到后进行索引的替换
            u = 0
            v = result.length - 1
            while (u < v) {
                c = (u + v) >> 1
                if (arr[result[c]] < arrI) {
                    u = c + 1
                } else {
                    v = c
                }
            }
            // 3.索引替换
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1]
                }
                result[u] = i
            }
        }
    }
    u = result.length
    v = result[u - 1]
    while (u-- > 0) {
        result[u] = v
        v = p[v]
    }
    return result
}
