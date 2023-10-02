import { isArray } from "@vue/shared";
import { Dep, createDep } from "./dep";
import { ComputedRefImpl } from "./computed";

export type EffectScheduler = (...args: any[]) => any
type KeyToDepMap = Map<any,Dep>

let targetMap:WeakMap<object,KeyToDepMap> = new WeakMap()


export let activeEffect: ReactiveEffect | undefined


export function effect<T = any>(fn: () => T) { 
    const _effect = new ReactiveEffect(fn)

    _effect.run()
}



export class ReactiveEffect<T = any> {
    computed?:ComputedRefImpl<T>

    

    constructor(public fn: () => T, public scheduler:EffectScheduler | null = null) {
        
    }

    run() { 
        activeEffect = this
        return this.fn()
     }

    
}


/**
 * 收集依赖，建立ReactiveEffect和指定对象的指定属性的联系
 */
export function track(target: object, key: string | symbol) { 

    if(!activeEffect) return
    
    let depsMap = targetMap.get(target)

    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key)

    if (!dep) {
        depsMap.set(key, (dep = createDep()))
    }

    trackEffects(dep)
    
 }

/**
 * 收集依赖，一对多
 */
export function trackEffects(dep: Dep) {
    dep.add(activeEffect!)
 }


 /**
 * 触发依赖，其实就是从targetMap取出fn
 */
export function trigger(target: object, key: string | symbol, value: unknown) {

    let depsMap = targetMap.get(target)

    if (!depsMap) return
    
    let dep = depsMap.get(key) as Dep

    if(!dep) return

    triggerEffects(dep)
    
}


export function triggerEffects(dep:Dep) { 
    let effects = isArray(dep) ? dep : [...dep]
    
    for (const effect of effects) { 
        if (effect.computed) { 
            triggerEffect(effect)
         }
     }

    for (const effect of effects) {
        if (!effect.computed) { 
            triggerEffect(effect)
         }
        
    }
 }

function triggerEffect(effect: ReactiveEffect) { 

    if (effect.scheduler) {
        effect.scheduler()
    } else { 
        effect.run()
     }
    
 }


 

