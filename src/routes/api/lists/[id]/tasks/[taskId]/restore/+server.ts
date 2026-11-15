import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	const { data: user, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !user.user) {
		return error(401, 'Unauthorized');
	}

	const { data: restored, error: restoreError } = await locals.supabase.rpc('set_task_deleted', {
		target_list_id: params.id,
		target_task_id: params.taskId,
		target_deleted: false
	});

	if (restoreError) {
		console.error('Error restoring task:', restoreError);
		if (restoreError.code === '42501') return error(403, 'Access denied');
		return error(500, 'Could not restore task');
	}

	if (!restored) return error(404, 'Task not found, not deleted, or expired');

	return json({ success: true });
};
