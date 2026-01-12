# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Broker Wingman Pro is a real estate broker management system built with React 18, TypeScript, Vite, and Supabase. The app manages brokers, clients, property listings, sales, meetings, expenses, goals, and tasks with role-based access control (Admin, Manager, Broker, Viewer).

## Development Commands

```bash
# Development server (runs on port 8080)
npm run dev

# Build
npm run build          # Production build
npm run build:dev      # Development build

# Linting
npm run lint

# Testing
npm run test            # Watch mode
npm run test:run        # Run once (CI/CD)
npm run test:ui         # With UI
npm run test:coverage   # With coverage report
```

## Architecture

### State Management Pattern

The app uses a **multi-provider context architecture** with a specific nesting order in `App.tsx`:

```
QueryClientProvider
  └─ ThemeProvider
      └─ AuthProvider
          └─ AdminProvider
              └─ BrokersProvider
                  └─ EventsProvider
                      └─ TasksProvider
                          └─ SalesProvider
                              └─ ListingsProvider
                                  └─ MeetingsProvider
                                      └─ ExpensesProvider
                                          └─ ClientsProvider
                                              └─ GoalsProvider
                                                  └─ PerformanceChallengesProvider
                                                      └─ NotificationsProvider
```

When adding new data entities, create a context provider and insert it at the appropriate level in this hierarchy.

### Page Structure

Pages are organized by role in `src/pages/`:
- `shared/` - Pages accessible to all authenticated users (Dashboard, Tasks, Agenda, Goals)
- `broker/` - Broker-specific pages (BrokerDashboard, Clients, Listings, Sales, BrokerProfile)
- `manager/` - Manager pages (Brokers list, Performance, Users)
- `admin/` - Admin-only pages (AdminPanel)
- Root level - Login, Register, ForgotPassword, ResetPassword, NotFound

### Authentication & Authorization

**Roles**: `admin` | `manager` | `broker` | `viewer`

**Permission System** (`src/hooks/usePermission.ts`):
- Use `usePermission()` hook to check permissions
- `hasPermission(permission)` - Check specific permission
- `hasRole(role)` - Check if user has exact role
- `hasAnyRole(roles)` - Check if user has any of the roles

**Route Protection** (`src/components/ProtectedRoute.tsx`):
```tsx
<ProtectedRoute>
  <MyPage />
</ProtectedRoute>

<ProtectedRoute allowedRoles={['admin', 'manager']}>
  <AdminPage />
</ProtectedRoute>
```

**Owner Email Whitelist**: Additional admin access via `VITE_OWNER_EMAILS` env var (comma-separated). See `src/config/adminConfig.ts`.

### Supabase Integration

- Client: `src/integrations/supabase/client.ts`
- RPC function for role lookup: `get_user_role(_user_id)`
- Database triggers auto-create profiles on signup
- Row Level Security (RLS) policies enforce data access

Migrations are in `supabase/migrations/` - run them in chronological order via Supabase SQL Editor when setting up a new project.

### TypeScript Configuration

- Path alias: `@/*` → `./src/*`
- Strict mode is disabled (`strict: false` in tsconfig.json)

### Testing Setup

**Framework**: Vitest with React Testing Library

**Test setup**: `src/test/setup.ts` includes mocks for:
- `window.matchMedia`
- `IntersectionObserver`
- `ResizeObserver`
- `PerformanceChallengesContext`
- `PerformanceContext`
- `AuthContext`

When writing tests, be aware these are globally mocked.

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OWNER_EMAILS=email1@example.com,email2@example.com  # Optional: Additional admin access
```

## Common Patterns

### Creating a New Entity Context

1. Create context in `src/contexts/YourEntityContext.tsx`
2. Follow the pattern of existing contexts (CRUD operations with Supabase)
3. Add provider to `App.tsx` nesting hierarchy
4. Export `useYourEntity()` hook

### Adding a Protected Route

1. Create page component in appropriate `src/pages/` subdirectory
2. Add route in `App.tsx` with `ProtectedRoute` wrapper
3. Use `allowedRoles` prop for role-specific pages

### Form Handling

- Use `react-hook-form` with `zod` validation
- shadcn/ui form components are in `src/components/ui/form.tsx`

## UI Components

- **shadcn/ui** base components: `src/components/ui/`
- Custom components: `src/components/` (root level)
- Icons: **lucide-react**
- Toast notifications: **sonner** (`toast()`)
- Charts: **recharts**
