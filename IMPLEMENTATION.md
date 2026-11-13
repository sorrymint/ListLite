# LiteList - Complete Svelte 5 UI Implementation

This document describes the completed Svelte 5 screens and components for the LiteList todo app, built with SvelteKit, TailwindCSS, and Supabase.

## Architecture Overview

### Routing Structure

```
/                          → Redirects to /auth or /lists based on auth state
/auth                      → Sign in / Sign up page (unauthenticated only)
/auth/callback             → OAuth callback handler (existing)
/lists                     → Dashboard showing all user's lists
/lists/[id]                → Detail page for a single list with tasks
/invite/[token]            → Accept invitation page
/api/lists                 → Create list endpoint (POST)
/api/lists/[id]            → Delete list endpoint (DELETE)
/api/lists/[id]/tasks      → Create task endpoint (POST)
/api/lists/[id]/tasks/[taskId] → Update/delete task endpoints (PATCH, DELETE)
/api/lists/[id]/invite     → Generate invite link endpoint (POST)
/api/lists/[id]/members/[userId] → Remove member endpoint (DELETE)
/api/lists/[id]/members/leave    → Leave list endpoint (POST)
/api/invite/[token]        → Accept invitation endpoint (POST)
```

## Components Built

### 1. Authentication Pages (`/auth`)

**File:** `src/routes/auth/+page.svelte`

Features:
- Split view with Sign In and Sign Up forms
- Clean, mobile-first design with Tailwind CSS
- Form validation and error handling
- Display of auth feedback messages
- Responsive grid layout (2-column on desktop, 1-column on mobile)
- Built-in Svelte transitions for feedback messages

**Svelte 5 Features Used:**
- Runes: `$props()`, `$state()`
- Event handling with event directives
- Conditional rendering with `{#if}...{/if}`
- Two-way binding with `bind:value`

### 2. Lists Dashboard (`/lists`)

**File:** `src/routes/lists/+page.svelte`

Features:
- Display all lists owned by user or shared with user
- Create new list with real-time form submission
- Delete lists (only owners can delete)
- Distinguish between owned and shared lists
- Empty state message
- Hover effects and smooth interactions

**Svelte 5 Features Used:**
- `$state()` for mutable component state
- `$derived()` for computed values (userId from data)
- `$effect()` to sync data prop changes with local state
- `fly` and `fade` transitions for add/remove animations
- `flip` animation for list reordering
- Async/await for API calls
- Conditional rendering based on ownership

### 3. List Detail Page (`/lists/[id]`)

**File:** `src/routes/lists/[id]/+page.svelte`

Features:
- Display list name and task count in sticky header
- Add new tasks to list
- Mark tasks complete/incomplete with visual feedback
- Delete individual tasks
- Toggle member panel showing all list members
- Generate and copy invite links (owner only)
- Remove members from list (owner only)
- Leave shared list (non-owners)
- Smooth section transitions

**Svelte 5 Features Used:**
- `$state()` for tasks, form inputs, UI state
- `$derived()` for computed values (userId, isOwner, listId, etc.)
- `$effect()` to sync task data changes
- `slide`, `fly`, `fade` transitions for sections and items
- `flip` animation for task list reordering
- `animate:flip` on `{#each}` blocks for smooth DOM updates
- Two-way binding for form inputs
- Class directives with conditional binding (`class:line-through`)
- Keyboard and mouse event handling

### 4. Invitation Acceptance (`/invite/[token]`)

**File:** `src/routes/invite/[token]/+page.svelte`

Features:
- Display invitation details (list name)
- Accept invitation with button action
- Skip option to return to lists
- Error state display
- Smooth animations on page load

**Svelte 5 Features Used:**
- `$state()` for form state and error handling
- `$props()` for reactive data updates
- `fly` transition on mount
- Conditional error display
- Async/await for API submission

## API Endpoints

### List Operations

- **POST /api/lists** - Create new list
  - Input: `{ name: string }`
  - Returns: Created list object
  - Auth: Required, must be authenticated

- **DELETE /api/lists/[id]** - Delete list
  - Auth: Required, must be list owner
  - Returns: `{ success: true }`

### Task Operations

- **POST /api/lists/[id]/tasks** - Create task
  - Input: `{ title: string }`
  - Auth: Required, must be list member
  - Returns: Created task object

- **PATCH /api/lists/[id]/tasks/[taskId]** - Update task completion status
  - Input: `{ is_complete: boolean }`
  - Auth: Required, must be list member
  - Returns: Updated task object

- **DELETE /api/lists/[id]/tasks/[taskId]** - Delete task
  - Auth: Required, must be list member
  - Returns: `{ success: true }`

### Invitation Operations

- **POST /api/lists/[id]/invite** - Generate invite link
  - Input: `{ expiresIn: number }` (days, default 7)
  - Auth: Required, must be list owner
  - Returns: `{ link: string, token: string }`

- **POST /api/invite/[token]** - Accept invitation
  - Auth: Required
  - Returns: `{ success: true }`

### Member Operations

- **DELETE /api/lists/[id]/members/[userId]** - Remove member from list
  - Auth: Required, must be list owner
  - Returns: `{ success: true }`

- **POST /api/lists/[id]/members/leave** - Leave a shared list
  - Auth: Required
  - Returns: `{ success: true }`

## Styling

### Tailwind CSS Classes Used

**Color Palette:**
- Slate: `slate-50`, `slate-100`, `slate-500`, `slate-700`, `slate-900`
- Teal: `teal-700`, `teal-800` (primary actions)
- Red: `red-50`, `red-600`, `red-700` (destructive actions)
- Green (inherited from existing auth)

**Layout:**
- Max-width container: `max-w-2xl` (mobile-first width constraint)
- Sticky header: `sticky top-0 z-40`
- Padding: `px-4 py-6 sm:py-8` (responsive)
- Gap utilities: `gap-2`, `gap-3`, `gap-4`
- Flexbox: `flex items-center justify-between`

**Interactive Elements:**
- Buttons: `min-h-11` (44px minimum height for touch targets)
- Transitions: `transition-colors` for hover states
- Hover states: `hover:bg-slate-100`, `hover:text-teal-800`
- Focus visible: `focus-visible:outline-offset-2 focus-visible:outline-3 focus-visible:outline-teal-500`

**Typography:**
- Headings: `text-2xl sm:text-3xl font-bold` (h1)
- Subheadings: `text-lg font-bold` (h2)
- Labels: `text-sm font-semibold`
- Small text: `text-sm text-slate-500`

## Svelte 5 Runes & Features

### Runes Used

1. **`$props()`** - Receive component props
   - Used in all page components to accept `data` from server
   - Type-safe with TypeScript interfaces

2. **`$state()`** - Create mutable reactive state
   - Form inputs: `newListName`, `newTaskTitle`
   - UI state: `showMembers`, `showInvite`, `isCreatingTask`
   - Lists: `lists`, `tasks`

3. **`$derived()`** - Create derived values
   - Computed from props: `userId`, `isOwner`, `listId`, `listName`
   - Always stays in sync with source data
   - No side effects

4. **`$derived.by()`** - Custom derived logic (not used but available)
   - For complex computations

5. **`$effect()`** - Reactive side effects
   - Sync data prop changes to local state: `tasks = data.tasks`
   - Cleanup with `cleanup()` function (used for timers)

### Transitions

Built-in Svelte transitions from `svelte/transition`:
- **`fly`** - Slide in/out with motion
  - Used on list items when added: `fly={{ y: -10, duration: 150 }}`
  - Used on invitation page: `fly={{ y: 20, duration: 300 }}`
  
- **`fade`** - Opacity transition
  - Empty states: `fade={{ duration: 200 }}`
  
- **`slide`** - Vertical expansion/collapse
  - Member and invite panels: `slide={{ duration: 200 }}`

### Animations

Built-in Svelte animations from `svelte/animate`:
- **`flip`** - FLIP animation for reordering
  - Applied to `{#each}` blocks for list items and tasks
  - Smoothly animates position changes: `animate:flip={{ duration: 200 }}`

### Control Flow

- **`{#each list as item (key)}`** - Loops with animation support
  - Used for lists, tasks, and members
  - Keyed by ID for proper reordering

- **`{#if condition}`** - Conditional rendering
  - Used for auth states, empty states, ownership checks

## Server-Side Logic

### Page Loads

1. **`/`** → Redirects to `/auth` or `/lists` based on auth state
   - Server checks `locals.supabase.auth.getUser()`

2. **`/auth`** → Only accessible when not authenticated
   - Redirects to `/lists` if already authenticated

3. **`/lists`** → Shows all user's lists
   - Queries lists where `owner_id = user.id` OR user is member
   - Loads with `order('updated_at', { ascending: false })`

4. **`/lists/[id]`** → Shows list details
   - Checks access with `is_list_member()` RPC function
   - Loads tasks, members, and owner status
   - Includes owner profile in members list

5. **`/invite/[token]`** → Handles invitation
   - Hashes token with SHA-256
   - Validates token exists, not revoked, not expired
   - Checks if user already member
   - Provides list name to display

## Database Integration

### Tables Accessed

- `profiles` - User display names
- `lists` - All lists
- `list_members` - Shared list membership
- `tasks` - All tasks
- `invitations` - Invite links with token hashes

### Functions Used

- `is_list_member(target_list_id uuid)` - Check membership
- `is_list_owner(target_list_id uuid)` - Check ownership

### Row-Level Security (RLS)

All operations respect database RLS policies:
- Users can only see/modify their own lists and tasks
- Owners can manage members and invitations
- All operations validated server-side

## Performance Optimizations

1. **Optimistic Updates** - UI updates immediately on user action
   - Lists refresh after create/delete
   - Tasks refresh after add/toggle/delete
   - Members list reloads after changes

2. **Minimal State** - Only local UI state in components
   - Server remains source of truth
   - Data prop is reactive via `$derived`

3. **Efficient Animations** - Use transform-based transitions
   - `fly` and `slide` use CSS transforms
   - `flip` uses requestAnimationFrame
   - No layout thrashing

4. **CSS Classes** - All styling via Tailwind utility classes
   - No generated CSS, pure utility application
   - Simple, maintainable selectors

## Mobile-First Responsive Design

- Base design works on phones (320px+)
- `sm:` breakpoint (640px+) for tablet/desktop improvements
- Touch targets minimum 44px (`min-h-11`)
- Responsive padding: `px-4 py-6 sm:py-8`
- Responsive font sizes: `text-2xl sm:text-3xl`
- Grid adjusts: `grid-cols-2` on desktop, `1fr` on mobile
- Sticky header for navigation on all sizes

## Error Handling

- **Minimal feedback** - No error messages shown per user preference
- Failed operations fail silently (logged to console)
- Operations can be retried by user action
- Network errors don't crash the app

## Browser Support

- Requires modern browser with ES2020+ support
- Uses Fetch API for HTTP requests
- Uses crypto.createHash() on server-side (Node.js)
- No IE11 or legacy browser support needed

## Files Structure

```
src/routes/
├── +layout.svelte              # Root layout (removed demo links)
├── +page.server.ts             # Root redirect logic
├── auth/
│   ├── +page.server.ts         # Sign in/up actions
│   └── +page.svelte            # Auth forms
├── invite/
│   └── [token]/
│       ├── +page.server.ts      # Load invitation details
│       └── +page.svelte         # Invitation UI
├── lists/
│   ├── +page.server.ts          # Load all lists
│   ├── +page.svelte             # Lists dashboard
│   └── [id]/
│       ├── +page.server.ts      # Load list & tasks
│       └── +page.svelte         # List detail & tasks
└── api/
    ├── lists/
    │   ├── +server.ts           # POST create list
    │   ├── [id]/
    │   │   ├── +server.ts       # DELETE list
    │   │   ├── invite/
    │   │   │   └── +server.ts   # POST generate invite
    │   │   ├── members/
    │   │   │   ├── [userId]/
    │   │   │   │   └── +server.ts   # DELETE remove member
    │   │   │   └── leave/
    │   │   │       └── +server.ts   # POST leave list
    │   │   └── tasks/
    │   │       ├── +server.ts   # POST create task
    │   │       └── [taskId]/
    │   │           └── +server.ts   # PATCH/DELETE task
    └── invite/
        └── [token]/
            └── +server.ts       # POST accept invite
```

## Building and Running

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check

# Linting
npm run lint

# Formatting
npm run format
```

## Future Enhancements

- Task due dates
- Task ordering/prioritization
- List color coding
- Real-time updates with subscriptions
- Offline support
- Push notifications
- Recurring tasks
- Task comments/notes
- Ownership transfer
