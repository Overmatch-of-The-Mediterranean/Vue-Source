import { Dep, createDep } from "./dep"
import { activeEffect, trackEffects, triggerEffects } from "./effect"
import { toReactive } from "./reactive"
import { hasChanged } from "@vue/shared"

export interface Ref<T = any> { 
    value:T
}


type RefBase<T> = {
  dep?: Dep
  value: T
}

/**
 * 判断是否为ref
*/
function isRef(r: any):r is Ref { 
    return !!(r && r.__v_isRef === true)
 }

export function ref(value?: unknown) { 
    return createRef(value, false)
}

function createRef(rowValue: unknown, shallow: boolean) { 
    if (isRef(rowValue)) { 
        return rowValue
    }

    return new RefImpl(rowValue,shallow)
}
 

class RefImpl<T = any>{ 
    private _rowValue?: T
    private _value:T

    public dep?: Dep = undefined
    __v_isRef?:boolean = true
    

    constructor(value: T, public readonly __v_isShallow:boolean) { 
        this._rowValue = value
        this._value = toReactive(value)
        
    }
    
    get value() { 
        trackRefValue(this)
        
        return this._value
    }
    
    set value(newVal) { 
        
        if (hasChanged(newVal, this._rowValue)) { 
            this._rowValue = newVal
            this._value = toReactive(newVal)
            triggerRefValue(this,newVal)
         }
     }
}
 
/**
 * 收集依赖
*/
export function trackRefValue(ref: RefBase<any>) { 
    if (activeEffect) { 
        trackEffects(ref.dep || (ref.dep = createDep()))
    }
    
 }

/**
 * 触发依赖
*/
export function triggerRefValue(ref: RefBase<any>,value?:any) {
    if (ref.dep) { 
        triggerEffects(ref.dep as Dep)
     }
 }
 
