import { extend } from "@vue/shared";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./transform/transformElment";
import { transformText } from "./transform/transformText";
import { generate } from "./codegen";
import { transformIf } from "./transform/vif";

export function baseCompile(template: string, options = {}) {
    // 将模板解析成AST
    const ast = baseParse(template)
    console.log(6666,JSON.stringify(ast));
    

    // 将AST转化为JavascriptAST
    transform(ast, extend(options, { nodeTransforms:[transformElement, transformText, transformIf] }))
    console.log(JSON.stringify(ast));
    
    
    // console.log(JSON.stringify(ast));
    
    
    return generate(ast)
}