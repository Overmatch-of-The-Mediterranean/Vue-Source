import { isFunction } from "@vue/shared"
import { Dep } from "./dep"
import { ReactiveEffect } from "./effect"
import { trackRefValue, triggerRefValue } from "./ref"

export type ComputedGetter<T> = (...args: any[]) => T

export class ComputedRefImpl<T> { 

    private _value!: T
    public dep?:Dep = undefined
    
    public effect:ReactiveEffect
    public _dirty = true

    public __v_isRef = true

    constructor(getter) { 
        this.effect = new ReactiveEffect(getter, () => { 
            if (!this._dirty) {
                this._dirty = true
                triggerRefValue(this)
            }
         })
        this.effect.computed = this
     }

    get value() { 
        trackRefValue(this)
        if (this._dirty) {
            this._dirty = false
            this._value = this.effect.run()
         }
        return this._value
     }

 }


export function computed(getterOrOptions) { 

    let getter = undefined
    let setter = undefined

    const onlyGetter = isFunction(getterOrOptions)

    if (onlyGetter) { 
        getter = getterOrOptions
    }

    const cRef = new ComputedRefImpl(getter)
    

    return cRef
 }