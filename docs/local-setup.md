# FlowPilot AI — Local Setup & Testing Guide

## 1. Environment Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Populate the Supabase credentials from your local Supabase CLI or hosted Supabase project:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

---

## 2. Database Migration & Seeding Procedure

### Using Supabase CLI (Recommended for Local Dev)
1. Initialize local Supabase instance:
   ```bash
   npx supabase start
   ```
2. Apply the migration:
   ```bash
   npx supabase db push
   # OR
   npx supabase migration up
   ```
3. Run the seed script:
   ```bash
   npx supabase db reset
   ```

### Using Supabase Hosted SQL Editor
1. Open the **SQL Editor** in the Supabase Dashboard.
2. Paste and run the contents of [supabase/migrations/20261007000001_initial_auth_and_workspaces.sql](file:///d:/Yasir%20-%20Works/CodexveTech/flowpilot-ai/supabase/migrations/20261007000001_initial_auth_and_workspaces.sql).
3. (Optional) Run [supabase/seed.sql](file:///d:/Yasir%20-%20Works/CodexveTech/flowpilot-ai/supabase/seed.sql) to seed demo workspaces.

---

## 3. Manual Verification Procedures

### Test 1: User Sign Up & Onboarding Flow
1. Start the dev server: `npm run dev`.
2. Navigate to `http://localhost:3000/signup`.
3. Fill in name, email (e.g. `user1@acme.com`), and password (`password123`).
4. Click **Create Account**.
5. You are redirected to `/onboarding`. Enter workspace name `Acme Systems` and click **Launch Workspace**.
6. Verify you land on `/overview` with `Acme Systems` active in the sidebar and header.

### Test 2: Protected Routes Enforcement
1. Open an Incognito window (unauthenticated).
2. Attempt to navigate directly to:
   - `http://localhost:3000/overview`
   - `http://localhost:3000/workflows`
   - `http://localhost:3000/settings`
3. **Expected Result:** The middleware immediately redirects to `http://localhost:3000/login?redirectTo=/overview`.

### Test 3: Multi-Tenant & Workspace Isolation Verification
1. Log in as `User A` (member of `Acme Systems`).
2. Open a second browser / incognito window and sign up as `User B` (member of `Beta Corp`).
3. Have `User A` visit `/settings` and add a member or update settings.
4. Have `User B` visit `/settings` in their workspace.
5. **Expected Result:**
   - `User B` cannot see `Acme Systems` in their workspace dropdown.
   - Postgres RLS blocks `User B` from querying or mutating `Acme Systems` records.
   - Attempting to manually switch to `Acme Systems` ID yields an `Unauthorized: You are not a member of this workspace` exception.

### Test 4: Password Reset Flow
1. Navigate to `http://localhost:3000/forgot-password`.
2. Enter email and click **Send Reset Link**.
3. Verify the success state is displayed.
