-- Limit which columns clients may write, so ids and timestamps stay server-controlled.
revoke insert, update on public.lists, public.tasks from authenticated;
grant insert (name, owner_id) on public.lists to authenticated;
grant update (name) on public.lists to authenticated;
grant insert (list_id, title, is_complete) on public.tasks to authenticated;
grant update (title, is_complete) on public.tasks to authenticated;

-- Owners already have access, so accepting their own invitation changes nothing.
create or replace function public.accept_list_invitation(invitation_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
	target_list_id uuid;
	target_owner_id uuid;
begin
	if (select auth.uid()) is null then
		raise exception 'Sign in is required to accept an invitation' using errcode = '42501';
	end if;

	select invitation.list_id, owned_list.owner_id
	into target_list_id, target_owner_id
	from public.invitations as invitation
	join public.lists as owned_list on owned_list.id = invitation.list_id
	where invitation.token_hash = encode(
		extensions.digest(convert_to(invitation_token, 'UTF8'), 'sha256'),
		'hex'
	)
		and invitation.revoked_at is null
		and invitation.expires_at > now();

	if target_list_id is null then
		raise exception 'Invitation is invalid, expired, or revoked';
	end if;

	if target_owner_id <> (select auth.uid()) then
		insert into public.list_members (list_id, user_id)
		values (target_list_id, (select auth.uid()))
		on conflict (list_id, user_id) do nothing;
	end if;

	return target_list_id;
end;
$$;

-- Lets a signed-in user see which list they are being invited to before accepting.
create function public.preview_list_invitation(invitation_token text)
returns table (list_id uuid, list_name text, owner_display_name text, expires_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
	if (select auth.uid()) is null then
		raise exception 'Sign in is required to view an invitation' using errcode = '42501';
	end if;

	return query
	select owned_list.id, owned_list.name, owner.display_name, invitation.expires_at
	from public.invitations as invitation
	join public.lists as owned_list on owned_list.id = invitation.list_id
	join public.profiles as owner on owner.id = owned_list.owner_id
	where invitation.token_hash = encode(
		extensions.digest(convert_to(invitation_token, 'UTF8'), 'sha256'),
		'hex'
	)
		and invitation.revoked_at is null
		and invitation.expires_at > now();
end;
$$;

revoke all on function public.preview_list_invitation(text) from public, anon;
grant execute on function public.preview_list_invitation(text) to authenticated;
