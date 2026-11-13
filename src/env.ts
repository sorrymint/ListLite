import { defineEnvVars } from '@sveltejs/kit/env';

function required(name: string) {
	return (value: string | undefined) => {
		if (!value?.trim()) throw new Error(`${name} must be set`);
		return value.trim();
	};
}

export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: {
		public: true,
		schema: required('PUBLIC_SUPABASE_URL')
	},
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
		public: true,
		schema: required('PUBLIC_SUPABASE_PUBLISHABLE_KEY')
	}
});
