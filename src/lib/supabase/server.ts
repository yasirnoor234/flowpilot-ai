import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export function getSupabaseConfig() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const supabaseAnonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  const isConfigured = Boolean(
    supabaseUrl &&
    !supabaseUrl.includes('placeholder') &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes('placeholder')
  );

  return {
    supabaseUrl: supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey: supabaseAnonKey || 'placeholder-anon-key',
    isConfigured,
  };
}

/**
 * Creates a server-side Supabase client for Server Components, Server Actions, and Route Handlers.
 * Uses the user's cookies to enforce Row Level Security (RLS).
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Can be ignored if called from a Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {
            // Can be ignored if called from a Server Component
          }
        },
      },
    }
  );
}

/**
 * Server-only Admin Client with Service Role privileges.
 * NEVER expose this to the browser or use outside of protected server jobs / webhooks.
 */
export function createAdminClient() {
  const { supabaseUrl } = getSupabaseConfig();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!serviceRoleKey || serviceRoleKey.includes('placeholder')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined or is placeholder in server environment variables.');
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
