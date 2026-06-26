import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const apiTarget = env.VITE_PROXY_API_TARGET || 'http://localhost:5000';

	return {
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, '.'),
			},
		},
		server: {
			host: '0.0.0.0',
			port: 3000,
			hmr: env.DISABLE_HMR !== 'true',
			watch: env.DISABLE_HMR === 'true' ? null : {},
			proxy: {
				'/api': {
					target: apiTarget,
					changeOrigin: true,
				},
				'/hubs': {
					target: apiTarget,
					changeOrigin: true,
					ws: true,
				},
			},
		},
		build: {
			chunkSizeWarningLimit: 650,
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (!id.includes('node_modules')) {
							return;
						}

						if (id.includes('leaflet-routing-machine')) {
							return 'leaflet-routing';
						}

						if (id.includes('leaflet') || id.includes('react-leaflet')) {
							return 'leaflet-vendor';
						}

						if (id.includes('@microsoft/signalr')) {
							return 'signalr-vendor';
						}
					},
				},
			},
		},
	};
});
