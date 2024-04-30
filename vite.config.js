import viteBasicSslPlugin from "@vitejs/plugin-basic-ssl"
import {defineConfig} from "vite"
import {resolve} from 'path'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                'mapbox-potree': resolve(__dirname, 'mapbox-potree/index.html'),
                'mapbox-threejs': resolve(__dirname, 'mapbox-threejs/index.html'),
                'mapbox-marker': resolve(__dirname, 'mapbox-marker/index.html')
            },
        }
    },
    base: '/product-xr-mapbox/',
    outDir: './../dist',
    plugins: [viteBasicSslPlugin()]
})