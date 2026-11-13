-- A stable function cannot see a row inserted by the same statement, so
-- "insert ... returning" on lists failed. Check ownership directly in the policy.
drop policy "List members can read their lists" on public.lists;

create policy "List members can read their lists"
on public.lists
for select to authenticated
using (owner_id = (select auth.uid()) or public.is_list_member(id));
