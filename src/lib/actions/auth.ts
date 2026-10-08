'use server';

import { createClient, getSupabaseConfig } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export interface AuthActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

function checkConfiguration(): AuthActionResult | null {
  const { isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return {
      error: 'Supabase is not configured. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel and redeploy.',
    };
  }
  return null;
}

export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const configError = checkConfiguration();
  if (configError) return configError;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.session) {
      revalidatePath('/', 'layout');
      redirect('/onboarding');
    }

    return {
      success: true,
      message: 'Account created! Please check your email to confirm your account or sign in.',
    };
  } catch (err: unknown) {
    console.error('Sign up error:', err);
    return {
      error: err instanceof Error ? err.message : 'Unable to connect to authentication server. Please try again.',
    };
  }
}

export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const configError = checkConfiguration();
  if (configError) return configError;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }
  } catch (err: unknown) {
    console.error('Sign in error:', err);
    return {
      error: err instanceof Error ? err.message : 'Unable to connect to authentication server. Please try again.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/overview');
}

export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err: unknown) {
    console.error('Sign out error:', err);
  }
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required.' };
  }

  const configError = checkConfiguration();
  if (configError) return configError;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/update-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return {
      success: true,
      message: 'Password reset link has been sent to your email address.',
    };
  } catch (err: unknown) {
    console.error('Reset password error:', err);
    return {
      error: err instanceof Error ? err.message : 'Unable to connect to authentication server. Please try again.',
    };
  }
}

export async function updatePasswordAction(formData: FormData): Promise<AuthActionResult> {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const configError = checkConfiguration();
  if (configError) return configError;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { error: error.message };
    }
  } catch (err: unknown) {
    console.error('Update password error:', err);
    return {
      error: err instanceof Error ? err.message : 'Unable to update password. Please try again.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/overview');
}
