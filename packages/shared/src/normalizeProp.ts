import { isArray, isObject, isString } from "@vue/shared"

export type NormalizedStyle = Record<string, string | number>


// class增强
export function normalizeClass(value: unknown) { 
    let res = ''
    
    if (isString(value)) {
        res = value as string
        
    } else if (isArray(value)) {
        
        for (let i = 0; i < value.length; i++) { 
            const normalized = normalizeClass(value[i])
            if (normalized) { 
                res += normalized + ' '
             }
         }

    } else if (isObject(value)) { 
        for (const name in value as object) { 
            if ((value as object)[name]) { 
                res += name + ' '
             }
        }
        
     }

    return res.trim()
}
 
// style增强
export function normalizeStyle(value: unknown) { 
    if (isArray(value)) {
        let res:NormalizedStyle = {}
        for (let i = 0; i < value.length; i++) { 
            const item = value[i]
            const normalized = isString(item)
                ? parseStringStyle(item)
                : normalizeStyle(item) as NormalizedStyle
            
            if (normalized) { 
                for (const name in normalized) {
                    res[name] = normalized[name]
                 }
             }
        }
        
        return res
    } else if (isString(value)) {
        return value
    } else if (isObject(value)) { 
        return value
     }
}
 

const listDelimiterRE = /;(?![^(]*\))/g
const propertyDelimiterRE = /:(.+)/

export function parseStringStyle(cssText: string) { 
    const ret = {}
    cssText.split(listDelimiterRE).map(item => { 
        if (item) { 
            const tmp = item.split(propertyDelimiterRE)
            tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim())
         }
    })
    
    return ret
 }