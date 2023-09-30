import { isString } from "@vue/shared"

export function patchStyle(el: Element, prev, next) { 
    
    const style = (el as HTMLElement).style
    const isCssString = isString(next)

    // 修改和新增样式
    if (next && !isCssString) { 
        for (const key in next) { 
            setStyle(style,key,next[key])
        }
        
    }
    
    // 移除旧style上的样式
    if (prev && !isString(prev)) { 
        for (const key in prev) { 
            if (next[key] == null) { 
                setStyle(style,key ,'')
             }
         }
     }

}
 
export function setStyle(style, name, value) { 
    style[name] = value
 }