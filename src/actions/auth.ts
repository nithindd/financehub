'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { validatePassword, validateUsername } from '@/lib/password-validator'
import { sendEmail } from '@/lib/email'

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/')
    redirect('/')
}

/**
 * Sign up a new user with email and password
 */
export async function signUpWithEmail(
    email: string,
    password: string,
    username: string,
    firstName?: string,
    lastName?: string
) {
    const supabase = await createClient()

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
        return { error: passwordValidation.errors.join(', ') }
    }

    // Validate username
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.isValid) {
        return { error: usernameValidation.error }
    }

    // Check if username is available
    const usernameCheck = await checkUsernameAvailability(username)
    if (!usernameCheck.available) {
        return { error: 'Username is already taken' }
    }

    // Create auth user
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                first_name: firstName,
                last_name: lastName,
            }
        }
    })

    if (error) {
        return { error: error.message }
    }

    // Profile is automatically created by the 'handle_new_user' trigger 
    // using the metadata (username, first_name, last_name) passed in signUp.

    // Notify Admins
    // We execute this asynchronously and don't block the UI response
    // In a real production app, this should go into a background job (e.g. Inngest)
    (async () => {
        try {
            // Find admins
            // Note: Service Role client needed to bypass default RLS if admins can't see other profiles
            // But usually, standard client works if we have proper policies. 
            // For safety in this "auth" action context, we might rely on the current user context, 
            // but the current user is the NEW user who definitely can't see admins.
            // So we really should use a service role, OR just accept that we need to query explicitly.
            // Since we don't have a service role client readily available in this file structure without refactor,
            // we will try to assume there is an internal admin helper or just use the current client 
            // BUT fetch from a public view? No. 

            // Actually, let's keep it simple. If we can't query admins due to RLS, we can't send.
            // But we can check for a specific ENV var for the "master" admin email to fallback.

            // Better Approach: Fetch from profiles where is_admin is true.
            // To do this reliably without exposing admin emails to the public RLS, we need `supabase-admin` (service role).
            // I'll assume standard RLS blocks this.
            // For now, I'll assume there is ONE main admin email in env, OR I'll attempt the query.

            // Let's try to get admins using a fresh client with service role if possible?
            // If not, we'll skip for now to avoid breaking the app and just log.

            // Wait, I can import createClient from utils/supabase/server, but that uses cookies. 
            // I need a SUPABASE_SERVICE_ROLE_KEY to bypass RLS.

            const adminEmail = process.env.ADMIN_EMAIL // Fallback

            if (adminEmail) {
                await sendEmail({
                    to: adminEmail,
                    subject: 'New User Registration - FinanceHub',
                    html: `
                        <h1>New User Registered</h1>
                        <p><strong>Username:</strong> ${username}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    `
                })
            } else {
                // Try to query if we could...
                // const { data: admins } = await supabase.from('profiles').select('email').eq('is_admin', true)
                // This query will likely fail or return empty due to RLS for the new user.
                console.log('Admin notification skipped: ADMIN_EMAIL env var not set.')
            }

        } catch (err) {
            console.error('Error sending admin notification:', err)
        }
    })()

    revalidatePath('/')
    return { success: true }
}

/**
 * Sign in a user with email and password
 */
export async function signInWithEmail(email: string, password: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    redirect('/')
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'Password reset email sent' }
}

/**
 * Update user password (from profile settings)
 */
export async function updatePassword(newPassword: string) {
    const supabase = await createClient()

    // Validate new password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
        return { error: passwordValidation.errors.join(', ') }
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'Password updated successfully' }
}

/**
 * Check if a username is available
 */
export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
    const supabase = await createClient()

    // Validate username format
    const validation = validateUsername(username)
    if (!validation.isValid) {
        return { available: false, error: validation.error }
    }

    // Check if username exists (case-insensitive)
    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .limit(1)

    if (error) {
        return { available: false, error: error.message }
    }

    return { available: data.length === 0 }
}
