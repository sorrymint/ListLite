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
		.select()
		.single();

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

	// Check if user is a list member
	const { data: isMember } = await locals.supabase.rpc('is_list_member', {
		target_list_id: params.id
	});

	if (!isMember) {
		return error(403, 'Access denied');
	}

	const { error: deleteError } = await locals.supabase
		.from('tasks')
		.delete()
		.eq('id', params.taskId)
		.eq('list_id', params.id);

	if (deleteError) {
		console.error('Error deleting task:', deleteError);
		return error(500, 'Could not delete task');
	}

	return json({ success: true });
};
