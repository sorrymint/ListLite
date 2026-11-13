-- Accounts created before profile creation was enforced may lack a display name.
insert into public.profiles (id, display_name)
select
	users.id,
	case
		when char_length(btrim(users.raw_user_meta_data ->> 'display_name')) between 1 and 100
			then btrim(users.raw_user_meta_data ->> 'display_name')
		else 'User'
	end
from auth.users as users
where not exists (select 1 from public.profiles where profiles.id = users.id)
on conflict (id) do nothing;
