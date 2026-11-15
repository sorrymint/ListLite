create extension if not exists pg_cron with schema pg_catalog;

alter table public.tasks
	add column deleted boolean not null default false,
	add column deleted_at timestamptz,
	add constraint tasks_deleted_at_matches_deleted
		check (deleted = (deleted_at is not null));

create index tasks_deleted_at_idx on public.tasks (deleted_at) where deleted;

-- Clients must use the function below, which controls both the timestamp and access.
revoke delete on public.tasks from authenticated;
drop policy "List members can delete tasks" on public.tasks;
drop policy "List members can update tasks" on public.tasks;
create policy "List members can update active tasks"
on public.tasks for update to authenticated
using (not deleted and public.is_list_member(list_id))
with check (not deleted and public.is_list_member(list_id));

create function public.set_task_deleted(target_list_id uuid, target_task_id uuid, target_deleted boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
	if (select auth.uid()) is null or not public.is_list_member(target_list_id) then
		raise exception 'Access denied' using errcode = '42501';
	end if;

	if target_deleted is null then
		raise exception 'Deletion state is required' using errcode = '22004';
	end if;

	update public.tasks
	set deleted = target_deleted,
		deleted_at = case when target_deleted then now() else null end
	where id = target_task_id
		and list_id = target_list_id
		and deleted <> target_deleted
		and (target_deleted or deleted_at > now() - interval '336 hours');

	return found;
end;
$$;

revoke all on function public.set_task_deleted(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_task_deleted(uuid, uuid, boolean) to authenticated;

select cron.schedule(
	'purge-deleted-tasks',
	'* * * * *',
	$cron$delete from public.tasks where deleted and deleted_at <= now() - interval '336 hours'$cron$
);
