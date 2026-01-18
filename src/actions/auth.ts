'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { validatePassword, validateUsername } from '@/lib/password-validator'

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

    // Update profile with additional info
    if (data.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                username,
                first_name: firstName,
                last_name: lastName,
            })
            .eq('id', data.user.id)

        if (profileError) {
            console.error('Profile update error:', profileError)
        }
    }

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
