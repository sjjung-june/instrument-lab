import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({build:{rollupOptions:{input:{xps:fileURLToPath(new URL('./xps.html',import.meta.url)),sims:fileURLToPath(new URL('./sims.html',import.meta.url))}}}});
