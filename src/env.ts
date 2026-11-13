import { defineEnvVars } from '@sveltejs/kit/env';

function required(name: string) {
	return (value: string | undefined) => {
		if (!value?.trim()) throw new Error(`${name} must be set`);
		return value.trim();
	};
}

export const variables = defineEnvVars({
	SUPABASE_URL: {
		schema: required('SUPABASE_URL')
	},
	SUPABASE_PUBLISHABLE_KEY: {
		schema: required('SUPABASE_PUBLISHABLE_KEY')
	}
});
