import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !data.user) {
		redirect(303, '/auth');
	}

	redirect(303, '/lists');
};
