import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { POST as createListHandler } from '../../src/routes/api/lists/+server';
import { load as loadLists } from '../../src/routes/lists/+page.server';
import { POST as createInvitationHandler } from '../../src/routes/api/lists/[id]/invite/+server';
import { POST as acceptInvitationHandler } from '../../src/routes/api/invite/[token]/+server';
import { load as loadInvitation } from '../../src/routes/invite/[token]/+page.server';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
const password = 'litelist-dev-only-password';

const newClient = () =>
	createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function signIn(email: string) {
	const client = newClient();
	const { data, error } = await client.auth.signInWithPassword({ email, password });
	if (error) throw error;
	return { client, id: data.user.id };
}

const token = () => randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '');
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let alex: { client: SupabaseClient; id: string };
let sam: { client: SupabaseClient; id: string };
let stranger: { client: SupabaseClient; id: string };
const anon = newClient();
const createdLists: string[] = [];

async function createList(client: SupabaseClient, ownerId: string, name = 'Test list') {
	const { data, error } = await client
		.from('lists')
		.insert({ name, owner_id: ownerId })
		.select()
		.single();
	expect(error).toBeNull();
	createdLists.push(data!.id);
	return data!.id as string;
}

async function invite(owner: SupabaseClient, listId: string, expires?: string) {
	const t = token();
	const { error } = await owner.rpc('create_list_invitation', {
		target_list_id: listId,
		invitation_token: t,
		...(expires ? { invitation_expires_at: expires } : {})
	});
	expect(error).toBeNull();
	return t;
}

const accept = (user: { client: SupabaseClient }, t: string) =>
	user.client.rpc('accept_list_invitation', { invitation_token: t });

beforeAll(async () => {
	alex = await signIn('alex@example.test');
	sam = await signIn('sam@example.test');

	const email = `stranger-${randomUUID()}@example.test`;
	const signUp = await newClient().auth.signUp({
		email,
		password,
		options: { data: { display_name: 'Stranger' } }
	});
	expect(signUp.error).toBeNull();
	stranger = await signIn(email);
});

afterAll(async () => {
	for (const id of createdLists) await alex.client.from('lists').delete().eq('id', id);
});

describe('profiles', () => {
	it('rejects sign-up without a display name', async () => {
		const { error } = await newClient().auth.signUp({
			email: `noname-${randomUUID()}@example.test`,
			password
		});
		expect(error).not.toBeNull();
	});

	it('creates a profile for new users and lets them edit only their own', async () => {
		const own = await stranger.client.from('profiles').select().eq('id', stranger.id);
		expect(own.data).toHaveLength(1);

		const edit = await stranger.client
			.from('profiles')
			.update({ display_name: 'Renamed' })
			.eq('id', stranger.id)
			.select();
		expect(edit.data).toHaveLength(1);

		const other = await stranger.client
			.from('profiles')
			.update({ display_name: 'Hacked' })
			.eq('id', alex.id)
			.select();
		expect(other.data ?? []).toHaveLength(0);
	});

	it('hides profiles of users who share no list', async () => {
		const { data } = await stranger.client.from('profiles').select().eq('id', alex.id);
		expect(data).toHaveLength(0);
	});

	it('shows profiles of users on shared lists', async () => {
		const listId = await createList(alex.client, alex.id);
		const invitation = await invite(alex.client, listId);
		expect((await accept(sam, invitation)).error).toBeNull();

		const { data, error } = await sam.client.from('profiles').select().eq('id', alex.id);
		expect(error).toBeNull();
		expect(data).toHaveLength(1);
	});
});

describe('anonymous access', () => {
	it.each(['profiles', 'lists', 'list_members', 'tasks', 'invitations'])(
		'cannot read %s',
		async (table) => {
			const { data, error } = await anon.from(table).select();
			expect(error !== null || data!.length === 0).toBe(true);
		}
	);

	it('cannot call invitation functions', async () => {
		const accepted = await accept({ client: anon }, token());
		const preview = await anon.rpc('preview_list_invitation', { invitation_token: token() });
		expect(accepted.error).not.toBeNull();
		expect(preview.error).not.toBeNull();
	});
});

describe('lists and tasks', () => {
	it('creates, previews, and accepts an invitation through the app', async () => {
		const listId = await createList(alex.client, alex.id, 'Invitation test');
		const response = await createInvitationHandler({
			params: { id: listId },
			locals: { supabase: alex.client },
			url: new URL('http://localhost'),
			request: new Request('http://localhost', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			})
		} as Parameters<typeof createInvitationHandler>[0]);
		expect(response.status).toBe(200);
		const { link, token: invitationToken } = await response.json();
		expect(link).toBe(`http://localhost/invite/${invitationToken}`);

		const preview = await loadInvitation({
			params: { token: invitationToken },
			locals: { supabase: stranger.client }
		} as Parameters<typeof loadInvitation>[0]);
		expect(preview?.invitation.lists.name).toBe('Invitation test');

		const accepted = await acceptInvitationHandler({
			params: { token: invitationToken },
			locals: { supabase: stranger.client }
		} as Parameters<typeof acceptInvitationHandler>[0]);
		expect(accepted.status).toBe(200);
		const { data, error } = await stranger.client.from('lists').select('id').eq('id', listId);
		expect(error).toBeNull();
		expect(data).toHaveLength(1);
	});

	it('creates a list through the API and returns it', async () => {
		const response = await createListHandler({
			locals: { supabase: alex.client },
			request: new Request('http://localhost/api/lists', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: '  API list  ' })
			})
		} as Parameters<typeof createListHandler>[0]);
		expect(response.status).toBe(200);
		const list = await response.json();
		createdLists.push(list.id);
		expect(list).toMatchObject({ name: 'API list', owner_id: alex.id });
	});

	it('lets the owner create and rename a list', async () => {
		const id = await createList(alex.client, alex.id, 'Mine');
		const rename = await alex.client
			.from('lists')
			.update({ name: 'Renamed' })
			.eq('id', id)
			.select();
		expect(rename.data?.[0].name).toBe('Renamed');
	});

	it('refuses to create a list owned by someone else', async () => {
		const { error } = await stranger.client.from('lists').insert({ name: 'x', owner_id: alex.id });
		expect(error).not.toBeNull();
	});

	it('shows owned and shared lists but not unrelated lists', async () => {
		const sharedId = await createList(alex.client, alex.id, 'Shared');
		const privateId = await createList(alex.client, alex.id, 'Private');
		const invitation = await invite(alex.client, sharedId);
		expect((await accept(stranger, invitation)).error).toBeNull();

		const owned = await alex.client
			.from('lists')
			.select('id, name, owner_id, created_at, updated_at')
			.order('updated_at', { ascending: false });
		expect(owned.error).toBeNull();
		expect(owned.data?.map((list) => list.id)).toEqual(
			expect.arrayContaining([sharedId, privateId])
		);

		const shared = await stranger.client
			.from('lists')
			.select('id, name, owner_id, created_at, updated_at')
			.order('updated_at', { ascending: false });
		expect(shared.error).toBeNull();
		expect(shared.data?.map((list) => list.id)).toContain(sharedId);
		expect(shared.data?.map((list) => list.id)).not.toContain(privateId);

		const dashboard = await loadLists({
			locals: { supabase: stranger.client }
		} as Parameters<typeof loadLists>[0]);
		expect(dashboard).toBeDefined();
		expect(dashboard!.lists.map((list: { id: string }) => list.id)).toContain(sharedId);
		expect(dashboard!.lists.map((list: { id: string }) => list.id)).not.toContain(privateId);
	});

	it('hides lists and tasks from non-members', async () => {
		const id = await createList(alex.client, alex.id);
		await alex.client.from('tasks').insert({ list_id: id, title: 'secret' });

		expect((await stranger.client.from('lists').select().eq('id', id)).data).toHaveLength(0);
		expect((await stranger.client.from('tasks').select().eq('list_id', id)).data).toHaveLength(0);

		const insert = await stranger.client.from('tasks').insert({ list_id: id, title: 'intruder' });
		expect(insert.error).not.toBeNull();
	});

	it('refuses to change owner or move tasks between lists', async () => {
		const id = await createList(alex.client, alex.id);
		const owner = await alex.client.from('lists').update({ owner_id: sam.id }).eq('id', id);
		expect(owner.error).not.toBeNull();

		const task = await alex.client
			.from('tasks')
			.insert({ list_id: id, title: 'a' })
			.select()
			.single();
		const move = await alex.client
			.from('tasks')
			.update({ list_id: randomUUID() })
			.eq('id', task.data!.id);
		expect(move.error).not.toBeNull();
	});

	it('validates task titles', async () => {
		const id = await createList(alex.client, alex.id);
		const { error } = await alex.client.from('tasks').insert({ list_id: id, title: '   ' });
		expect(error).not.toBeNull();
	});

	it('updates updated_at when a task changes', async () => {
		const id = await createList(alex.client, alex.id);
		const { data: task } = await alex.client
			.from('tasks')
			.insert({ list_id: id, title: 'a' })
			.select()
			.single();
		await sleep(20);
		const { data: updated } = await alex.client
			.from('tasks')
			.update({ is_complete: true })
			.eq('id', task!.id)
			.select()
			.single();
		expect(updated!.is_complete).toBe(true);
		expect(new Date(updated!.updated_at) > new Date(task!.updated_at)).toBe(true);
	});
});

describe('invitations', () => {
	it('lets another user preview, accept, and then work in the list', async () => {
		const listId = await createList(alex.client, alex.id, 'Shared');
		const t = await invite(alex.client, listId);

		const preview = await stranger.client.rpc('preview_list_invitation', {
			invitation_token: t
		});
		expect(preview.data?.[0]).toMatchObject({
			list_name: 'Shared',
			owner_display_name: 'Alex Rivera'
		});

		expect((await accept(stranger, t)).data).toBe(listId);

		const add = await stranger.client
			.from('tasks')
			.insert({ list_id: listId, title: 'From member' });
		expect(add.error).toBeNull();

		// Invitations are reusable.
		expect((await accept(sam, t)).error).toBeNull();
	});

	it('only the owner can create, view, or revoke invitations', async () => {
		const listId = await createList(alex.client, alex.id);
		const t = await invite(alex.client, listId);
		await accept(stranger, t);

		const create = await stranger.client.rpc('create_list_invitation', {
			target_list_id: listId,
			invitation_token: token()
		});
		expect(create.error).not.toBeNull();
		expect((await stranger.client.from('invitations').select()).data).toHaveLength(0);

		const { data } = await alex.client.from('invitations').select().eq('list_id', listId);
		expect(data).toHaveLength(1);
		const revoke = await stranger.client.rpc('revoke_list_invitation', {
			target_invitation_id: data![0].id
		});
		expect(revoke.error).not.toBeNull();
	});

	it('does not store the raw token', async () => {
		const listId = await createList(alex.client, alex.id);
		const t = await invite(alex.client, listId);
		const { data } = await alex.client.from('invitations').select().eq('list_id', listId);
		expect(JSON.stringify(data)).not.toContain(t);
	});

	it('rejects revoked invitations', async () => {
		const listId = await createList(alex.client, alex.id);
		const t = await invite(alex.client, listId);
		const { data } = await alex.client.from('invitations').select().eq('list_id', listId);
		const revoke = await alex.client.rpc('revoke_list_invitation', {
			target_invitation_id: data![0].id
		});
		expect(revoke.error).toBeNull();
		expect((await accept(stranger, t)).error).not.toBeNull();
	});

	it('rejects expired invitations', async () => {
		const listId = await createList(alex.client, alex.id);
		const t = await invite(alex.client, listId, new Date(Date.now() + 1500).toISOString());
		await sleep(2500);
		expect((await accept(stranger, t)).error).not.toBeNull();
	});

	it('rejects unknown tokens and invalid tokens or expiry', async () => {
		expect((await accept(stranger, token())).error).not.toBeNull();

		const listId = await createList(alex.client, alex.id);
		const tooLong = await alex.client.rpc('create_list_invitation', {
			target_list_id: listId,
			invitation_token: token(),
			invitation_expires_at: new Date(Date.now() + 90 * 86400000).toISOString()
		});
		expect(tooLong.error).not.toBeNull();

		const short = await alex.client.rpc('create_list_invitation', {
			target_list_id: listId,
			invitation_token: 'short'
		});
		expect(short.error).not.toBeNull();
	});

	it('owner accepting their own invitation adds no membership row', async () => {
		const listId = await createList(alex.client, alex.id);
		const t = await invite(alex.client, listId);
		await accept(alex, t);
		const { data } = await alex.client.from('list_members').select().eq('list_id', listId);
		expect(data).toHaveLength(0);
	});
});

describe('membership', () => {
	it('lets owners remove members and members leave, but not remove others', async () => {
		const listId = await createList(alex.client, alex.id);
		const t = await invite(alex.client, listId);
		expect((await accept(sam, t)).error).toBeNull();
		expect((await accept(stranger, t)).error).toBeNull();
		const otherListId = await createList(alex.client, alex.id);
		const otherInvitation = await invite(alex.client, otherListId);
		expect((await accept(sam, otherInvitation)).error).toBeNull();

		await sam.client.from('list_members').delete().eq('list_id', listId).eq('user_id', stranger.id);
		let { data } = await alex.client.from('list_members').select().eq('list_id', listId);
		expect(data).toHaveLength(2);

		const removal = await alex.client
			.from('list_members')
			.delete()
			.eq('list_id', listId)
			.eq('user_id', stranger.id);
		expect(removal.error).toBeNull();
		const leave = await sam.client
			.from('list_members')
			.delete()
			.eq('list_id', listId)
			.eq('user_id', sam.id);
		expect(leave.error).toBeNull();
		({ data } = await alex.client.from('list_members').select().eq('list_id', listId));
		expect(data).toHaveLength(0);
		expect((await sam.client.from('lists').select().eq('id', listId)).data).toHaveLength(0);
		const otherMembership = await sam.client
			.from('list_members')
			.select()
			.eq('list_id', otherListId)
			.eq('user_id', sam.id);
		expect(otherMembership.error).toBeNull();
		expect(otherMembership.data).toHaveLength(1);
	});

	it('cannot add members directly', async () => {
		const listId = await createList(alex.client, alex.id);
		const { error } = await stranger.client
			.from('list_members')
			.insert({ list_id: listId, user_id: stranger.id });
		expect(error).not.toBeNull();
	});
});

describe('deletion', () => {
	it('only the owner can delete a list, and it cascades', async () => {
		const listId = await createList(alex.client, alex.id);
		const t = await invite(alex.client, listId);
		await accept(sam, t);
		await alex.client.from('tasks').insert({ list_id: listId, title: 'a' });

		await sam.client.from('lists').delete().eq('id', listId);
		expect((await alex.client.from('lists').select().eq('id', listId)).data).toHaveLength(1);

		await alex.client.from('lists').delete().eq('id', listId);
		const count = async (table: string, column: string) =>
			(await alex.client.from(table).select().eq(column, listId)).data;
		expect(await count('lists', 'id')).toHaveLength(0);
		expect(await count('tasks', 'list_id')).toHaveLength(0);
		expect(await count('invitations', 'list_id')).toHaveLength(0);
		expect(await count('list_members', 'list_id')).toHaveLength(0);
	});
});
