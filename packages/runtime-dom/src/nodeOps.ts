const doc = document

export const nodeOps = { 
    insert(child: Element, parent: Element, anchor) { 
        parent.insertBefore(child, anchor || null)
    },
    createElement(tag: string) { 
        const el = doc.createElement(tag)
        return el
    },
    setElementText(el: Element, text: string) { 
        el.textContent = text
    },
    remove(child:Element) { 
        const parent = child.parentNode
        if (parent) { 
            parent.removeChild(child)
         }
    },
    createText(value) { 
        return doc.createTextNode(value)
    },
    createComment(value) { 
        return doc.createComment(value)
    },
    setText(node, text) { 
        node.nodeValue = text
     }
    
 } 