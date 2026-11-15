import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { data: user, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !user.user) {
		return error(401, 'Unauthorized');
	}

	// Check if user is a list member
	const { data: isMember } = await locals.supabase.rpc('is_list_member', {
		target_list_id: params.id
	});

	if (!isMember) {
		return error(403, 'Access denied');
	}

	const { is_complete } = await request.json();

	const { data: task, error: taskError } = await locals.supabase
		.from('tasks')
		.update({ is_complete })
		.eq('id', params.taskId)
		.eq('list_id', params.id)
		.eq('deleted', false)
		.select()
		.maybeSingle();

	if (taskError) {
		console.error('Error updating task:', taskError);
		return error(500, 'Could not update task');
	}

	if (!task) {
		return error(404, 'Task not found');
	}

	return json(task);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { data: user, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !user.user) {
		return error(401, 'Unauthorized');
	}

	const { data: deleted, error: deleteError } = await locals.supabase.rpc('set_task_deleted', {
		target_list_id: params.id,
		target_task_id: params.taskId,
		target_deleted: true
	});

	if (deleteError) {
		console.error('Error deleting task:', deleteError);
		if (deleteError.code === '42501') return error(403, 'Access denied');
		return error(500, 'Could not delete task');
	}

	if (!deleted) return error(404, 'Task not found or already deleted');

	return json({ success: true });
};
