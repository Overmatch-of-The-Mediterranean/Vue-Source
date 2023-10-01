import { LifeCycleHooks } from "./component"

// 传入要注册的生命周期钩子是什么
export const onBeforeMount = createHook(LifeCycleHooks.BEFORE_Mount)

export const onMounted = createHook(LifeCycleHooks.MOUNTED)

function createHook(lifecycle) { 
    return (hook,target) => { 
        injectHook(lifecycle, hook, target)
     }
}

function injectHook(type:LifeCycleHooks, hook, target) { 
    if (target) { 
        target[type] = hook
     }
 }