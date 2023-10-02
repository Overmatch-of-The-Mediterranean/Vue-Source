import { reactive } from "@vue/reactivity"
import { isFunction, isObject } from "@vue/shared"
import { onBeforeMount, onMounted } from "./apiLifecycle"

export const enum LifeCycleHooks  { 
    BEFORE_CREATE = 'bc',
    CREATED = 'c',
    BEFORE_Mount = 'bm',
    MOUNTED = 'm'
 }

let uid = 0

export function createComponentInstance(vnode) { 
    const type = vnode.type
    
    const instance = {
        uid: uid++,
        type,
        vnode,
        render: null,
        subTree: null,
        effect: null,
        update: null,
        isMounted: false,
        bc: null,
        c: null,
        bm: null,
        m:null
    }


    return instance
}
 
export function setupComponent(instance) { 
    setupStatefulComponent(instance)
}
 
export function setupStatefulComponent(instance) { 

    const { setup } = instance.type

    
    if (setup) {
        const setupResult = setup()
        
        handleSetupResult(setupResult, instance)
        
        

    } else { 
        finishComponentSetup(instance)
     }

    
 }

function handleSetupResult(setupResult, instance) { 
    if (isFunction(setupResult)) { 
        instance.render = setupResult
    }
    finishComponentSetup(instance)
    
 }


/**
 * 1.赋值render
 * 2.处理options
*/
export function finishComponentSetup(instance) {
    const Component = instance.type
    if (!instance.render) { 
        instance.render = Component.render
     }
    

    applyOptions(instance)
}

export function applyOptions(instance) { 
    // debugger
    const {
        data: dataOptions,
        beforeCreate,
        created,
        beforeMount,
        mounted
    } = instance.type
    
    // 初始化参数前执行
    if (beforeCreate) { 
        callHook(beforeCreate,instance)
     }

    // stateful component的处理
    // 1. 使用proxy包裹
    // 2. 改变vnode中的this指向
    if (dataOptions) { 
        const data = dataOptions()
        if (isObject(data)) { 
            instance.data = reactive(data)
         }

    }
    
    // 初始化参数后执行
    if (created) { 
        callHook(created,instance)
    }
    

    function registerLifecycleHook(register, hook) { 
        register(hook?.bind(instance.data),instance)
     }

    // 注册其余的生命周期钩子
    registerLifecycleHook(onBeforeMount, beforeMount)
    registerLifecycleHook(onMounted,mounted)
}
export function callHook(hook,instance) {
    hook.call(instance.data)
 }