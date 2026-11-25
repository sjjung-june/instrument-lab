import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({build:{rollupOptions:{input:Object.fromEntries(['xrm','nanoindenter','raman','ftir','afmir'].map(kind=>[kind,fileURLToPath(new URL(`./${kind}.html`,import.meta.url))]))}}});
