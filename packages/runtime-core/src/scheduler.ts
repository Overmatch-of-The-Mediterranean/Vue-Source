
let isFlushPending = false

const pendingPreFlushCbs: Function[] = []

const resolvedPromise = Promise.resolve() as Promise<any>

let currentFlushPromise:Promise<void> | null = null

/**
 * 建立任务队列
*/
export function queuePreFlushCb(cb: Function) { 
    queueCb(cb, pendingPreFlushCbs)    
}
 
function queueCb(cb: Function, pendingFlush:Function[]) {
    pendingFlush.push(cb)
    queueFlush()
}


function queueFlush() { 
    if (!isFlushPending) { 
        isFlushPending = true
        // 将任务队列放在微任务中，然后循环遍历出执行
        currentFlushPromise = resolvedPromise.then(flushJobs)
     }
}
 
function flushJobs() {
    isFlushPending = false
    flushPreFlushCbs()
}

function flushPreFlushCbs() {
    if (pendingPreFlushCbs.length) {
        const activePreFlushCbs = [...new Set(pendingPreFlushCbs)]
        pendingPreFlushCbs.length = 0
        for (let i = 0; i < activePreFlushCbs.length; i++) { 
            activePreFlushCbs[i]()
        }
     }

}