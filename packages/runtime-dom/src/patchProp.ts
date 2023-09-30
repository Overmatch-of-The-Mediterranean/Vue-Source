import { isOn } from "@vue/shared";
import { patchClass } from "./modules/class";
import { patchDOMProp } from "./modules/prop";
import { patchAttr } from "./modules/attr";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

export function patchProp(el:Element, key:string, preValue, nextValue) {  
    if (key === 'class') {
        patchClass(el, nextValue)
    } else if (key === 'style') {
        patchStyle(el,preValue,nextValue)
    } else if (isOn(key)) {
        patchEvent(el, key, preValue, nextValue)
    } else if (shouldAsProp(el,key)) { 
        patchDOMProp(el,key,nextValue)
    } else { 
        patchAttr(el,key,nextValue)
     }
}

const shouldAsProp = (el:Element,key) => { 
    if (key === 'form') { 
        return false
    }
    
    if (key === 'list' && el.tagName === 'input') { 
        return false
    }
    
    if (key === 'type' && el.tagName === 'textarea') {
        return false
    }
    
    return key in el
 }