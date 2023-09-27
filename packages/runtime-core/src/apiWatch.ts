import { EMPTY_OBJ, hasChanged, isObject, isReactive } from "@vue/shared"
import { ReactiveEffect } from "packages/reactivity/src/effect"
import { queuePreFlushCb } from './scheduler'

interface WatchOptions { 
    immediate?: boolean
    deep?: boolean
 }

export function watch(source, cb: Function, options?: WatchOptions) {
    doWatch(source,cb,options)
}

function doWatch(source, cb: Function, { immediate, deep }: WatchOptions = EMPTY_OBJ) {
    
    let getter: () => any
    
    if (isReactive(source)) {
        getter = () => source
        deep = true
    } else {
        getter = ()=>{}
    }

    if (cb && deep) { 
        const baseGetter = getter
        getter = () => traverse(baseGetter())
    }
    
    let oldValue = {}

    // job执行一次，相当于watch执行一次
    let job = () => {
        if (cb) { 
            let newValue = effect.run()
            if (deep || hasChanged(newValue, oldValue)) { 
                cb(newValue, oldValue)

                oldValue = newValue
             }
         }
     }

    let scheduler = () => queuePreFlushCb(job)

    let effect = new ReactiveEffect(getter, scheduler)

    if (cb) {
        if (immediate) {
            job()
        } else { 
            effect.run()
        }
    } else {
        effect.run()
    }
}

/**
 * watch收集依赖的关键
*/
function traverse(value:unknown) {

    if (!isObject(value)) { 
        return value
    }

    for (const key in value as object) {
        traverse((value as object)[key])
    }

    return value
}