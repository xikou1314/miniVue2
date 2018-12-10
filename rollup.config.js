import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'src/core/core.js',
  output: {
    file: './dist/bundle.js',
    format: 'iife',
    name: 'KV'
  },
  plugins: [ resolve(), commonjs() ]
};