import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { data: user, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !user.user) {
		return error(401, 'Unauthorized');
	}

	const { title } = await request.json();

	if (!title || typeof title !== 'string' || !title.trim()) {
		return error(400, 'Task title is required');
	}

	// Check if user is a list member
	const { data: isMember } = await locals.supabase.rpc('is_list_member', {
		target_list_id: params.id
	});

	if (!isMember) {
		return error(403, 'Access denied');
	}

	const { data: task, error: taskError } = await locals.supabase
		.from('tasks')
		.insert({
			list_id: params.id,
			title: title.trim()
		})
		.select()
		.single();

	if (taskError) {
		console.error('Error creating task:', taskError);
		return error(500, 'Could not create task');
	}

	return json(task);
};
