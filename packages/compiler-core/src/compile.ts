import { extend } from "@vue/shared";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./transform/transformElment";
import { transformText } from "./transform/transformText";

export function baseCompile(template: string, options = {}) {
    // 将模板解析成AST
    const ast = baseParse(template)


    // 将AST转化为JavascriptAST
    transform(ast, extend(options, { nodeTransforms:[transformElement, transformText] }))
    console.log(ast);
    
    
    console.log(JSON.stringify(ast));
    
    
    return {}
}