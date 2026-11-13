-- Local-only development accounts. Never reuse these credentials online.
insert into auth.users (
	instance_id,
	id,
	aud,
	role,
	email,
	encrypted_password,
	email_confirmed_at,
	raw_app_meta_data,
	raw_user_meta_data,
	created_at,
	updated_at,
	confirmation_token,
	recovery_token,
	email_change,
	email_change_token_new
)
values
	(
		'00000000-0000-0000-0000-000000000000',
		'10000000-0000-4000-8000-000000000001',
		'authenticated',
		'authenticated',
		'alex@example.test',
		extensions.crypt('litelist-dev-only-password', extensions.gen_salt('bf')),
		now(),
		'{"provider":"email","providers":["email"]}'::jsonb,
		'{"display_name":"Alex Rivera"}'::jsonb,
		now(),
		now(),
		'',
		'',
		'',
		''
	),
	(
		'00000000-0000-0000-0000-000000000000',
		'10000000-0000-4000-8000-000000000002',
		'authenticated',
		'authenticated',
		'sam@example.test',
		extensions.crypt('litelist-dev-only-password', extensions.gen_salt('bf')),
		now(),
		'{"provider":"email","providers":["email"]}'::jsonb,
		'{"display_name":"Sam Chen"}'::jsonb,
		now(),
		now(),
		'',
		'',
		'',
		''
	)
on conflict (id) do update
set instance_id = excluded.instance_id,
	email = excluded.email,
	encrypted_password = excluded.encrypted_password,
	email_confirmed_at = excluded.email_confirmed_at,
	raw_app_meta_data = excluded.raw_app_meta_data,
	raw_user_meta_data = excluded.raw_user_meta_data,
	confirmation_token = '',
	recovery_token = '',
	email_change = '',
	email_change_token_new = '',
	updated_at = now();

-- Email/password sign-in requires an identity row for each user.
insert into auth.identities (
	id,
	user_id,
	provider_id,
	provider,
	identity_data,
	created_at,
	updated_at
)
select
	users.id,
	users.id,
	users.id::text,
	'email',
	jsonb_build_object('sub', users.id::text, 'email', users.email, 'email_verified', true),
	now(),
	now()
from auth.users as users
where users.id in (
	'10000000-0000-4000-8000-000000000001',
	'10000000-0000-4000-8000-000000000002'
)
on conflict (provider_id, provider) do nothing;

insert into public.profiles (id, display_name)
values
	('10000000-0000-4000-8000-000000000001', 'Alex Rivera'),
	('10000000-0000-4000-8000-000000000002', 'Sam Chen')
on conflict (id) do update
set display_name = excluded.display_name;

insert into public.lists (id, owner_id, name)
values
	(
		'20000000-0000-4000-8000-000000000001',
		'10000000-0000-4000-8000-000000000001',
		'Weekend plans'
	),
	(
		'20000000-0000-4000-8000-000000000002',
		'10000000-0000-4000-8000-000000000002',
		'Reading list'
	)
on conflict (id) do update
set owner_id = excluded.owner_id,
	name = excluded.name;

insert into public.list_members (list_id, user_id)
values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002')
on conflict (list_id, user_id) do nothing;

insert into public.tasks (id, list_id, title, is_complete)
values
	(
		'30000000-0000-4000-8000-000000000001',
		'20000000-0000-4000-8000-000000000001',
		'Pick a place for lunch',
		false
	),
	(
		'30000000-0000-4000-8000-000000000002',
		'20000000-0000-4000-8000-000000000001',
		'Bring the board game',
		true
	),
	(
		'30000000-0000-4000-8000-000000000003',
		'20000000-0000-4000-8000-000000000002',
		'Finish the current book',
		false
	)
on conflict (id) do update
set list_id = excluded.list_id,
	title = excluded.title,
	is_complete = excluded.is_complete;

insert into public.invitations (id, list_id, invited_by, token_hash, expires_at)
values (
	'40000000-0000-4000-8000-000000000001',
	'20000000-0000-4000-8000-000000000002',
	'10000000-0000-4000-8000-000000000002',
	encode(
		extensions.digest(convert_to('litelist-dev-invitation-token-0001', 'UTF8'), 'sha256'),
		'hex'
	),
	now() + interval '7 days'
)
on conflict (id) do update
set list_id = excluded.list_id,
	invited_by = excluded.invited_by,
	token_hash = excluded.token_hash,
	expires_at = excluded.expires_at,
	revoked_at = null;
