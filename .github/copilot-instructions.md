# Broker Wingman Pro - AI Coding Agent Instructions

## Project Overview
Real estate broker management platform built with React + TypeScript + Vite, using Supabase for backend/auth and shadcn/ui components.

## Architecture Patterns

### Context-Based State Management
- **Global state via React Context** (not Redux): Each domain has a dedicated Context provider (`src/contexts/`)
- All Contexts follow the same pattern: fetch data on mount, filter by `user_id`, expose CRUD methods
- Example: `BrokersContext.tsx`, `TasksContext.tsx`, `SalesContext.tsx`
- **Provider nesting in App.tsx**: AuthProvider wraps all other providers which wrap the Router
- Always use `const { data } = useContext()` hook, never access Context directly

### Authentication & Authorization
- **Supabase Auth** with custom role system: `admin`, `manager`, `broker`, `viewer`
- Roles stored in `user_roles` table, retrieved via `get_user_role()` RPC function
- `AuthContext` handles login/register/logout and fetches user profile + role on session changes
- **Permission system**: `usePermission` hook checks role-based permissions (see `src/hooks/usePermission.ts`)
- **Route protection**: Use `<ProtectedRoute allowedRoles={['admin']}>` wrapper
- **Component-level guards**: Use `<RoleGuard allowedRoles={[...]}>` for conditional UI rendering
- User context includes: `id`, `email`, `name`, `role`

### Database Patterns (Supabase)
- **Row Level Security (RLS)** enabled on all tables with role-based policies
- Use `supabase.from('table_name')` for queries - types auto-generated in `src/integrations/supabase/types.ts`
- All tables include `user_id` for multi-tenancy isolation
- **Security definer functions**: RLS policies call `has_role()` and `get_user_role()` to prevent recursion
- Migrations in `supabase/migrations/` - timestamps indicate execution order
- Profile auto-creation via `handle_new_user()` trigger on user registration

### Component Architecture
- **shadcn/ui components**: Pre-built in `src/components/ui/`, customizable via Tailwind
- Use `cn()` utility from `src/lib/utils.ts` for conditional classnames
- Custom components: `BrokerCard`, `MetricCard`, `Navigation`, `ProtectedRoute`, `RoleGuard`
- **Import alias**: `@/` maps to `src/` (configured in vite.config.ts and tsconfig.json)
- Components use controlled form state with `useState` (not react-hook-form in most places)

### Data Flow Example
1. User logs in → `AuthContext.login()` → Supabase auth → profile fetch → role retrieval
2. Page loads → Context provider's `useEffect` fetches data filtered by `user_id`
3. Component consumes via hook: `const { brokers } = useBrokers()`
4. User action → Context method (e.g., `createBroker()`) → Supabase mutation → state update → re-render

## Development Workflows

### Local Development
```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint check
```

### Supabase Local Development
- Config in `supabase/config.toml` - project ID: `lblarqxqhjipwotusyba`
- Migrations auto-applied via Supabase CLI or dashboard
- When adding RLS policies, always use security definer functions for role checks

### Adding New Features
1. **New entity type**: Create Context provider in `src/contexts/`, add to App.tsx provider stack
2. **New page**: Add route in `App.tsx`, wrap with `<ProtectedRoute>` if auth required
3. **New permissions**: Update `rolePermissions` in `usePermission.ts`, add RLS policies in migration
4. **New UI component**: Use shadcn CLI or manually add to `src/components/ui/`

## Project-Specific Conventions

### TypeScript Configuration
- `noImplicitAny: false` - allows implicit any types (can be improved gradually)
- `strictNullChecks: false` - nullable values not strictly enforced
- Optional chaining (`?.`) used extensively for null safety despite loose config

### Styling Patterns
- Tailwind utility classes for all styling - NO CSS modules
- Color palette: Uses Tailwind theme with custom pink accents (`bg-pink-700`, `hover:bg-pink-600`)
- Responsive: Mobile-first approach with `sm:`, `md:`, `lg:` breakpoints
- Dark mode ready via `next-themes` (not fully implemented yet)

### Naming Conventions
- **Files**: PascalCase for components (`BrokerCard.tsx`), camelCase for utilities (`usePermission.ts`)
- **Database**: snake_case (`user_id`, `created_at`) - auto-mapped to camelCase in Context providers
- **Props**: TypeScript interfaces suffixed with `Props` (`ProtectedRouteProps`)
- **Context hooks**: `use` prefix (`useBrokers`, `useAuth`, `useTasks`)

### Error Handling
- Context methods return `{ error?: string }` on failures
- Toast notifications via `useToast()` hook for user feedback
- Console errors for debugging: `console.error('Error fetching brokers:', error)`
- No global error boundary - errors handled locally in components

### State Patterns
- Loading states: `isLoading` boolean in Contexts, render `null` or skeleton during load
- Optimistic updates: Update local state immediately, rollback on error (not consistently applied)
- Form state: Local `useState` with controlled inputs, reset after submission

## Critical Integration Points

### Supabase Client
- Singleton instance in `src/integrations/supabase/client.ts`
- Auto-refreshes auth tokens, persists session to localStorage
- Import as: `import { supabase } from "@/integrations/supabase/client"`

### React Query
- Configured in App.tsx but **not actively used** - Contexts handle data fetching instead
- Available for future migration to server state management

### Routing
- `react-router-dom` v6 - nested Routes in `App.tsx`
- URL params accessed via `useParams()`: `/broker/:brokerId`
- Navigation via `useNavigate()` hook, not `<Link>` components
- Catch-all 404 route: `<Route path="*" element={<NotFound />} />`

## Common Gotchas

1. **User ID filtering**: Always filter queries by `user_id` to respect multi-tenancy
2. **Role checks**: Use `has_role()` function in RLS policies, NOT direct table joins (causes recursion)
3. **Profile creation**: New users must have profile created via trigger - check `handle_new_user()` function
4. **Context dependencies**: Auth must load first - other Contexts check `if (!user) return` in fetch logic
5. **Route order**: Custom routes MUST come before `path="*"` catch-all in App.tsx
6. **Import paths**: Always use `@/` alias, never relative paths like `../../`

## Testing Approach
- **No test files present** - manual testing workflow
- Test user roles via Supabase dashboard by inserting into `user_roles` table
- Use browser DevTools for debugging Context state and Supabase queries

## Key Files Reference
- **Entry point**: `src/main.tsx` → `src/App.tsx`
- **Auth logic**: `src/contexts/AuthContext.tsx`
- **Type definitions**: `src/integrations/supabase/types.ts` (auto-generated from DB schema)
- **Routing**: `src/App.tsx` (all routes defined here)
- **Permissions**: `src/hooks/usePermission.ts` (role-permission mappings)
- **Utilities**: `src/lib/utils.ts` (just `cn()` helper)
- **Latest migration**: `supabase/migrations/20251010185600_fix_handle_new_user_trigger.sql`
