import { extend, isString } from "@vue/shared"
import { createRenderer } from "packages/runtime-core/src/renderer"
import { patchProp } from "./patchProp"
import { nodeOps } from "./nodeOps"

const rendererOptions = extend({ patchProp },nodeOps)

let renderer

function ensureRenderer() { 
     return renderer || (renderer = createRenderer(rendererOptions))
  }

export const render = (...arg) => { 
    ensureRenderer().render(...arg)
} 
 
export const createApp = (...arg) => {
    const app = ensureRenderer().createApp(...arg)

    const { mount } = app

    app.mount = (containerOrSelector) => {
        const container = normalizeContainer(containerOrSelector)
        if (!container) {
            return
        }

        mount(container)
    }

    return app
}

function normalizeContainer(container:Element | string): Element | null{
    if (isString(container)) {
        const res = document.querySelector(container as string)
        return res
    }

    return container as Element
}