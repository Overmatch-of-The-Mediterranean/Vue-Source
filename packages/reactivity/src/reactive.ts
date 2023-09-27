import { isObject } from "@vue/shared"
import { mutableHandlers } from "./baseHandlers"


// 存储，target和proxy的映射关系
let reactiveMap = new WeakMap<object, any>()

export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly'

}

export interface Target {
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean

}



export function reactive(target: object) { 
    return createReactiveObject(target, mutableHandlers, reactiveMap)
}
 
function createReactiveObject(target: Object, baseHandlers: ProxyHandler<any>, proxyMap: WeakMap<object,any>) {
    const existingProxy = proxyMap.get(target)

    if (existingProxy) {
        return existingProxy
    }

    const proxy = new Proxy(target, baseHandlers)
    proxy[ReactiveFlags.IS_REACTIVE] = true
    proxyMap.set(target, proxy)

    return proxy
}
 

export function toReactive<T extends unknown>(value: any) { 
    return isObject(value) ? reactive(value) : value 
}