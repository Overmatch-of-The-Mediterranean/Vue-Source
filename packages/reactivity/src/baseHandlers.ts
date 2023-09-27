import { track, trigger } from "./effect" 


function createGetter() { 
    return function get(target: object, key: string | symbol, receiver: object) { 
        const res = Reflect.get(target, key, receiver)
        track(target, key)
        return res
    }
}


function createSetter() {
    return function set(target:object, key:string | symbol, value:unknown ,receiver:object) {
        const result = Reflect.set(target, key, value, receiver)
        trigger(target, key, value)
        return result
    }
}

const get = createGetter()

const set = createSetter()



export const mutableHandlers = {
    get,
    set
}