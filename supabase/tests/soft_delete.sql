-- Run only against the seeded local database. The inner block rolls back its changes.
do $test$
declare
	list_id uuid := gen_random_uuid();
	recent_id uuid := gen_random_uuid();
	recent_trashed_id uuid := gen_random_uuid();
	boundary_id uuid := gen_random_uuid();
	old_id uuid := gen_random_uuid();
	active_id uuid := gen_random_uuid();
	job_command text;
begin
	begin
		perform set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
		insert into public.lists (id, owner_id, name)
		values (list_id, '10000000-0000-4000-8000-000000000001', 'Expiry test');
		insert into public.tasks (id, list_id, title, deleted, deleted_at) values
			(recent_id, list_id, 'Just within retention', true, now() - interval '336 hours' + interval '1 microsecond'),
			(recent_trashed_id, list_id, 'Still recoverable', true, now() - interval '336 hours' + interval '1 microsecond'),
			(boundary_id, list_id, 'At expiry', true, now() - interval '336 hours'),
			(old_id, list_id, 'Past expiry', true, now() - interval '337 hours'),
			(active_id, list_id, 'Active', false, null);

		if public.set_task_deleted(list_id, boundary_id, false) then
			raise exception 'A task at the 14-day boundary was restored';
		end if;
		if public.set_task_deleted(list_id, old_id, false) then
			raise exception 'An expired task was restored';
		end if;
		if not public.set_task_deleted(list_id, recent_id, false) then
			raise exception 'A task within the 14-day window was not restored';
		end if;

		select command into strict job_command
		from cron.job
		where jobname = 'purge-deleted-tasks' and schedule = '* * * * *' and active;
		execute job_command;

		if exists (select 1 from public.tasks where id in (boundary_id, old_id)) then
			raise exception 'The scheduled purge did not remove expired tasks';
		end if;
		if (select count(*) from public.tasks where id in (recent_id, recent_trashed_id, active_id)) <> 3 then
			raise exception 'The scheduled purge removed a task before expiry or an active task';
		end if;
		raise sqlstate 'P1234';
	exception when sqlstate 'P1234' then
		null;
	end;
end;
$test$;
