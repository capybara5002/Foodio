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
	};
});
