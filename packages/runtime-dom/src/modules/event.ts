export function patchEvent(el: Element & { _vei?: {} }, rawName, prevValue, nextValue) { 
    
    const invokers = el._vei || (el._vei = {})
    const existingInvoker = invokers[rawName]

    if (nextValue && existingInvoker) {
        existingInvoker.value = nextValue
    } else { 
        const name = parseName(rawName)
        if (nextValue) { 
            const invoker = (invokers[rawName] = createInvoker(nextValue))
            el.addEventListener(name,invoker)
        }
        
        if (existingInvoker) { 
            el.removeEventListener(name, existingInvoker)
            invokers[rawName] = undefined
        }
     }
    
    
}
 
const parseName = (name: string) => { 
    return name.slice(2).toLowerCase()
 }

const createInvoker = (value) => { 
    const invoker = () => { 
        invoker.value && invoker.value()
    }
    
    invoker.value = value

    return invoker
 }