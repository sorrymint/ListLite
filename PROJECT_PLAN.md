# LiteList project plan

## Goal

A simple to-do list app with a thin web client and a backend as a service (BaaS). Android and iOS clients may follow
using the same backend. The backend handles authentication, data access, permissions, and business logic; clients handle
presentation. The client is never trusted to enforce authorization.

**Stack:** SvelteKit + TypeScript (web), Supabase (Postgres + Auth). Mobile technology is undecided.
Setup and commands are in [README.md](./README.md).

## Product decisions

- Email/password accounts with a required display name.
- Every list has an owner; personal and shared lists are the same thing.
- All members can add, edit, complete, and delete tasks. Only the owner renames or deletes the list and manages members
  and invitations. Deleting a list permanently deletes its contents.
- Invitations are reusable links that expire after 7 days by default (30 at most) and can be revoked. The recipient signs
  in and explicitly accepts.

## Current state

**Done**

- Auth: sign up, sign in, sign out, cookie sessions verified server-side (`src/hooks.server.ts`, `src/routes/+page.server.ts`),
  and an email-confirmation callback (`src/routes/auth/callback`). Local email confirmation is currently off.
- Database (`supabase/migrations`, applied locally): tables `profiles`, `lists`, `list_members`, `tasks`, `invitations`;
  row-level security (RLS) policies; column-level write grants; triggers for `updated_at` and profile creation; and
  functions `is_list_member`, `is_list_owner`, `create_list_invitation`, `preview_list_invitation`,
  `accept_list_invitation`, `revoke_list_invitation`. Invitation tokens are stored only as SHA-256 hashes.
- Seed data: two dev users, sample lists, tasks, and an invitation (`supabase/seed.sql`).
- Tests: 9 unit tests (`npm run test:unit -- --run`) and 26 database tests (`npm run test:db`) covering profiles, anonymous
  denial, list/task access, invitations (reuse, expiry, revocation), membership, and cascading deletion.

**Not done**

- List and task screens, and the invitation UI (create link, preview, accept, manage members).
- Password reset; end-to-end test of email confirmation redirects (callback is allow-listed for ports 5173 and 3000).
- Hosted Supabase project, deployment, and generated TypeScript types for the schema
  (`npx supabase gen types typescript --local`).

## How the backend is used

The web server builds a Supabase client from the user's cookie, so every query runs as that user and RLS applies.
The app uses `supabase-js` directly on tables, and `supabase.rpc(...)` for the invitation functions. The client generates
the invitation token (at least 32 random characters) and builds the link. Authorization lives only in the database.

## Next steps

1. Generate TypeScript types from the schema.
2. Build the authenticated list and task screens.
3. Build the invitation workflow and member management.
4. Add password reset and test email confirmation with confirmation enabled.
5. Create the hosted Supabase project, apply migrations (no seed), configure Auth URLs, and test access rules there.
6. Expand normal and unauthorized end-to-end coverage.

Deferred: ownership transfer, task ordering/due dates, expired-invitation cleanup, offline mode, push notifications,
recurring tasks, and real-time updates.

## Working approach

Work in small phases and explain unfamiliar terms and security decisions in plain English. The project owner is learning
to work effectively with AI and prefers quick, direct work. Never run `db reset` on the owner's local database without
asking. Add new migration files rather than editing applied ones, and add a database test for any rule you change.
