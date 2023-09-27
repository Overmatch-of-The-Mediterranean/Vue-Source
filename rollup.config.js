import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"
import resolve from "@rollup/plugin-node-resolve"

export default [
    {
        input: 'packages/vue/src/index.ts',
        output: [
            {
                sourceMap: true,
                file: './packages/vue/dist/vue.js',
                format: 'iife',
                name:'Vue'
            }
        ],
        plugins: [
            typescript({
                sourceMap:true
            }),
            // 模块导入的路径补全
            resolve(),
            // 转commonjs为es module
            commonjs()
        ]
    }
]