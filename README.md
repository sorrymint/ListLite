# LiteList

A demo to-do list app for [sorrymint](https://github.com/sorrymint) to learn backend as a service (BaaS).
It is a learning project, not a template for production use.

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for the architecture, current status, and next steps.

## AI Disclosure

This project was created with the help of AI tools.
I used this project not only to learn about BaaS, but also to learn how to work effectively with AI. I am learning to use AI tools to help me write code, documentation, and tests. I am also learning to use AI tools to help me understand and debug code.

## Quick start

Run Supabase commands **on the host** (they need Docker). The app can run on the host or in Distrobox.

```sh
npm install
cp .env.example .env     # then paste the publishable key printed by `supabase start`
npx supabase start       # starts the local Supabase stack
npx supabase db reset    # applies migrations and seed data (deletes local data!)
npm run dev              # http://localhost:5173
```

Never put a Supabase secret or service-role key in `.env`; only the URL and publishable key belong there.
Studio (database UI) is at <http://127.0.0.1:54323> and Mailpit (test email) at <http://127.0.0.1:54324>.
Stop the stack with `npx supabase stop`. The stack exposes dev services to your network, so avoid untrusted networks.

## Development accounts

The seed creates these local-only accounts. Never use them on a hosted project.

| Email               | Password                     |
| ------------------- | ---------------------------- |
| `alex@example.test` | `litelist-dev-only-password` |
| `sam@example.test`  | `litelist-dev-only-password` |

Sample invitation token: `litelist-dev-invitation-token-0001`.

## Commands

| Command                      | Purpose                                                                    |
| ---------------------------- | -------------------------------------------------------------------------- |
| `npm run dev`                | Start the dev server                                                       |
| `npm run build`              | Production build                                                           |
| `npm run check`              | Svelte and TypeScript checks                                               |
| `npm run lint`               | Prettier and ESLint                                                        |
| `npm run format`             | Auto-format                                                                |
| `npm run test:unit -- --run` | Unit tests (no Supabase needed)                                            |
| `npm run test:db`            | Database tests against the running local stack (access rules, invitations) |
| `npm run test:e2e`           | Playwright end-to-end tests                                                |
| `npx supabase migration up`  | Apply new migrations without deleting local data                           |
| `npx supabase db reset`      | Recreate the local database from migrations and seed                       |

`test:db` needs `npx supabase start` and a seeded database. It cleans up its own lists, but each run leaves one extra
test user until the next `db reset`.

## Database

Schema changes live in `supabase/migrations`. Add a new migration file for each change; do not edit applied ones.
Tests are in `supabase/tests`. Supabase Auth owns `auth.users`; a trigger creates a matching `public.profiles` row.

## Hosted Supabase (not set up yet)

Local and hosted projects have separate users and data. For a hosted project:

1. Apply the migrations to it. Do not apply the seed.
2. Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the deployment provider.
3. Set the Auth site URL and allow-list `https://your-app-domain/auth/callback`.

## Web UI Implementation

The complete Svelte 5 UI is now implemented. See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for detailed architecture documentation.

### Quick Start (Web UI)

```bash
npm run dev
# Navigate to http://localhost:5173

# First visit:
# → Redirects to /auth (unauthenticated)
# → Sign up or sign in
# → Redirects to /lists dashboard
# → Create lists, add tasks, manage members
```

### Key Features

- **Authentication**: Sign in/up with email/password
- **Lists**: Create, view, and delete lists
- **Tasks**: Add, complete, and delete tasks with smooth animations
- **Sharing**: Generate shareable invite links (7-day expiry)
- **Members**: View members, remove members (owners only)
- **Responsive**: Mobile-first design, works on all screen sizes
- **Animations**: Built-in Svelte transitions and flip animations

### Routes

- `/` - Auto-redirect to auth or lists
- `/auth` - Sign in / Sign up
- `/lists` - Dashboard of all lists
- `/lists/[id]` - List detail with tasks
- `/invite/[token]` - Accept invitation

### Pages Built

✓ Authentication pages (sign in / sign up)  
✓ Lists dashboard (create, view, delete)  
✓ List detail page (tasks, members, invitations)  
✓ Invitation acceptance flow  
✓ Member management (view, remove)  
✓ Full API backend (create, read, update, delete)  

See IMPLEMENTATION.md for complete architecture documentation.
