import { ShapeFlags } from "packages/shared/src/shapeFlags"
import { normalizeVNode } from "./vnode"

export function renderComponentRoot(instance) { 
    const { render, vnode, data } = instance
    

    let result

    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) { 
        result = normalizeVNode(render.call(data)!)
        
     }

    return result
 }