import { compile } from "@vue/compiler-dom";
import { registerRuntimeCompiler } from "packages/runtime-core/src/component";

export function compileToFunction(template, options?) { 
    const { code } = compile(template, options)
    console.log(code);
    
    const render = new Function(code)()

    return render

}

registerRuntimeCompiler(compileToFunction)
 
export { compileToFunction as compile }