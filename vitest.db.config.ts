import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// Database tests run against the local Supabase stack and use its seed users.
export default defineConfig(({ mode }) => ({
	test: {
		name: 'database',
		environment: 'node',
		include: ['supabase/tests/**/*.spec.ts'],
		fileParallelism: false,
		testTimeout: 20000,
		env: loadEnv(mode, process.cwd(), 'PUBLIC_')
	}
}));
