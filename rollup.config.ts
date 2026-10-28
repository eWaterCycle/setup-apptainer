// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import license from 'rollup-plugin-license'

const config = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    typescript(),
    nodeResolve({ preferBuiltins: true }),
    json(),
    commonjs(),
    license({
      sourcemap: true,
      thirdParty: {
        includePrivate: true,
        multipleVersions: true,
        output: 'dist/licenses.txt'
      }
    })
  ]
}

export default config
