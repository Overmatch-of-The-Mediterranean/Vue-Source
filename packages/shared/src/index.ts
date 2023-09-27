import { ReactiveEffect } from "packages/reactivity/src/effect"
import { ReactiveFlags } from "packages/reactivity/src/reactive"
import { Target } from 'packages/reactivity/src/reactive'

export const isArray = Array.isArray
export const extend = Object.assign

/**
 * 判断是否是对象
 */
export const isObject = (val: unknown) => val && typeof val === 'object'


/**
 * 判断前后值是否相等
*/
export const hasChanged = (newVal: any, oldVal: any) => !Object.is(newVal, oldVal)


export function isFunction(val:unknown): val is Function { 
    return typeof val === 'function' 
}
 
export const EMPTY_OBJ = {}

export const isReactive = (val: unknown) => !!(val && (val as Target)[ReactiveFlags.IS_REACTIVE])

export function isProxy(value: unknown): boolean {
  return isReactive(value) || isReadonly(value)
}

export function isReadonly(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_READONLY])
}

export const isString = (val:any) => typeof val === 'string'
