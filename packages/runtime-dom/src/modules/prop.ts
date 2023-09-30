export function patchDOMProp(el: Element, key, value) { 
    try {
        el[key] = value
    } catch (error) {
        console.log(error);
        
    }
 }