create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	display_name text not null check (
		char_length(btrim(display_name)) between 1 and 100
	),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.lists (
	id uuid primary key default gen_random_uuid(),
	owner_id uuid not null references public.profiles (id) on delete cascade,
	name text not null check (char_length(btrim(name)) between 1 and 120),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.list_members (
	list_id uuid not null references public.lists (id) on delete cascade,
	user_id uuid not null references public.profiles (id) on delete cascade,
	created_at timestamptz not null default now(),
	primary key (list_id, user_id)
);

create table public.tasks (
	id uuid primary key default gen_random_uuid(),
	list_id uuid not null references public.lists (id) on delete cascade,
	title text not null check (char_length(btrim(title)) between 1 and 500),
	is_complete boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.invitations (
	id uuid primary key default gen_random_uuid(),
	list_id uuid not null references public.lists (id) on delete cascade,
	invited_by uuid not null references public.profiles (id) on delete cascade,
	token_hash text not null unique,
	expires_at timestamptz not null,
	revoked_at timestamptz,
	created_at timestamptz not null default now(),
	check (token_hash ~ '^[0-9a-f]{64}$')
);

create index lists_owner_id_idx on public.lists (owner_id);
create index list_members_user_id_idx on public.list_members (user_id);
create index tasks_list_id_created_at_idx on public.tasks (list_id, created_at);
create index invitations_list_id_idx on public.invitations (list_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger lists_set_updated_at
before update on public.lists
for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
	new_display_name text;
begin
	new_display_name := nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '');

	if new_display_name is null or char_length(new_display_name) > 100 then
		raise exception 'A display name of 1 to 100 characters is required';
	end if;

	insert into public.profiles (id, display_name)
	values (new.id, new_display_name);

	return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

insert into public.profiles (id, display_name)
select
	users.id,
	btrim(users.raw_user_meta_data ->> 'display_name')
from auth.users as users
where char_length(btrim(users.raw_user_meta_data ->> 'display_name')) between 1 and 100
on conflict (id) do nothing;

create function public.is_list_member(target_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1
		from public.lists as owned_list
		where owned_list.id = target_list_id
			and owned_list.owner_id = (select auth.uid())
	)
	or exists (
		select 1
		from public.list_members as membership
		where membership.list_id = target_list_id
			and membership.user_id = (select auth.uid())
	);
$$;

create function public.is_list_owner(target_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1
		from public.lists as owned_list
		where owned_list.id = target_list_id
			and owned_list.owner_id = (select auth.uid())
	);
$$;

alter table public.profiles enable row level security;
alter table public.lists enable row level security;
alter table public.list_members enable row level security;
alter table public.tasks enable row level security;
alter table public.invitations enable row level security;

create policy "Users can read their own profile and profiles of list collaborators"
on public.profiles
for select to authenticated
using (
	id = (select auth.uid())
	or exists (
		select 1
		from public.lists as shared_list
		where (
			shared_list.owner_id = profiles.id
			or exists (
				select 1
				from public.list_members as target_membership
				where target_membership.list_id = shared_list.id
					and target_membership.user_id = profiles.id
			)
		)
		and public.is_list_member(shared_list.id)
	)
);

create policy "Users can update their own display name"
on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Users can create their own profile"
on public.profiles
for insert to authenticated
with check (id = (select auth.uid()));

create policy "List members can read their lists"
on public.lists
for select to authenticated
using (public.is_list_member(id));

create policy "Users can create lists they own"
on public.lists
for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "Only owners can rename their lists"
on public.lists
for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Only owners can permanently delete their lists"
on public.lists
for delete to authenticated
using (owner_id = (select auth.uid()));

create policy "List members can read membership"
on public.list_members
for select to authenticated
using (public.is_list_member(list_id));

create policy "Owners can remove members and members can leave"
on public.list_members
for delete to authenticated
using (public.is_list_owner(list_id) or user_id = (select auth.uid()));

create policy "List members can read tasks"
on public.tasks
for select to authenticated
using (public.is_list_member(list_id));

create policy "List members can create tasks"
on public.tasks
for insert to authenticated
with check (public.is_list_member(list_id));

create policy "List members can update tasks"
on public.tasks
for update to authenticated
using (public.is_list_member(list_id))
with check (public.is_list_member(list_id));

create policy "List members can delete tasks"
on public.tasks
for delete to authenticated
using (public.is_list_member(list_id));

create policy "Only list owners can read invitations"
on public.invitations
for select to authenticated
using (public.is_list_owner(list_id));

revoke all on public.profiles, public.lists, public.list_members, public.tasks, public.invitations
from public, anon, authenticated;
grant select, insert (id, display_name), update (display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.lists to authenticated;
grant select, delete on public.list_members to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select on public.invitations to authenticated;
grant usage on schema public to authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;
revoke all on function public.is_list_member(uuid) from public, anon;
revoke all on function public.is_list_owner(uuid) from public, anon;
grant execute on function public.is_list_member(uuid) to authenticated;
grant execute on function public.is_list_owner(uuid) to authenticated;

create function public.create_list_invitation(
	target_list_id uuid,
	invitation_token text,
	invitation_expires_at timestamptz default (now() + interval '7 days')
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
	new_invitation_id uuid;
begin
	if (select auth.uid()) is null then
		raise exception 'Sign in is required to create an invitation' using errcode = '42501';
	end if;

	if not public.is_list_owner(target_list_id) then
		raise exception 'Only the list owner can create invitations' using errcode = '42501';
	end if;

	if invitation_token is null or char_length(invitation_token) < 32 then
		raise exception 'Invitation tokens must contain at least 32 characters';
	end if;

	if invitation_expires_at is null
		or invitation_expires_at <= now()
		or invitation_expires_at > now() + interval '30 days' then
		raise exception 'Invitation expiry must be within the next 30 days';
	end if;

	insert into public.invitations (list_id, invited_by, token_hash, expires_at)
	values (
		target_list_id,
		(select auth.uid()),
		encode(extensions.digest(convert_to(invitation_token, 'UTF8'), 'sha256'), 'hex'),
		invitation_expires_at
	)
	returning id into new_invitation_id;

	return new_invitation_id;
end;
$$;

create function public.accept_list_invitation(invitation_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
	target_list_id uuid;
begin
	if (select auth.uid()) is null then
		raise exception 'Sign in is required to accept an invitation' using errcode = '42501';
	end if;

	select invitation.list_id into target_list_id
	from public.invitations as invitation
	where invitation.token_hash = encode(
		extensions.digest(convert_to(invitation_token, 'UTF8'), 'sha256'),
		'hex'
	)
		and invitation.revoked_at is null
		and invitation.expires_at > now();

	if target_list_id is null then
		raise exception 'Invitation is invalid, expired, or revoked';
	end if;

	insert into public.list_members (list_id, user_id)
	values (target_list_id, (select auth.uid()))
	on conflict (list_id, user_id) do nothing;

	return target_list_id;
end;
$$;

create function public.revoke_list_invitation(target_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
	update public.invitations as invitation
	set revoked_at = now()
	where invitation.id = target_invitation_id
		and public.is_list_owner(invitation.list_id)
		and invitation.revoked_at is null;

	if not found then
		raise exception 'Invitation was not found or has already been revoked';
	end if;
end;
$$;

revoke all on function public.create_list_invitation(uuid, text, timestamptz) from public, anon;
revoke all on function public.accept_list_invitation(text) from public, anon;
revoke all on function public.revoke_list_invitation(uuid) from public, anon;
grant execute on function public.create_list_invitation(uuid, text, timestamptz) to authenticated;
grant execute on function public.accept_list_invitation(text) to authenticated;
grant execute on function public.revoke_list_invitation(uuid) to authenticated;
