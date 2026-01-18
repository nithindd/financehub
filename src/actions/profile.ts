'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateUsername } from '@/lib/password-validator'

/**
 * Update user profile information
 */
export async function updateProfile(formData: {
    firstName?: string
    lastName?: string
    username?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // If username is being updated, validate it first
    if (formData.username) {
        const validation = validateUsername(formData.username)
        if (!validation.isValid) {
            return { error: validation.error }
        }

        // Check if username is already taken by another user
        const { data: existing } = await supabase
            .from('profiles')
            .select('id, username')
            .ilike('username', formData.username)
            .neq('id', user.id)
            .limit(1)

        if (existing && existing.length > 0) {
            return { error: 'Username is already taken' }
        }
    }

    // Update profile
    const { error } = await supabase
        .from('profiles')
        .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            username: formData.username,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/profile')
    return { success: true, message: 'Profile updated successfully' }
}

/**
 * Get current user profile
 */
export async function getUserProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

    if (error) {
        console.error('Profile fetch error:', error)
        return { error: error.message }
    }

    // If no profile exists, create a default one
    if (!profile) {
        const defaultUsername = user.email?.split('@')[0] || 'user'
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                username: defaultUsername,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (createError) {
            console.error('Profile creation error:', createError)
            // Return basic profile data even if creation fails
            return {
                profile: {
                    id: user.id,
                    username: defaultUsername,
                    first_name: null,
                    last_name: null,
                    email: user.email,
                    updated_at: new Date().toISOString()
                }
            }
        }

        return {
            profile: {
                ...newProfile,
                email: user.email
            }
        }
    }

    return {
        profile: {
            ...profile,
            email: user.email
        }
    }
}

/**
 * Enable 2FA for the current user
 */
export async function enable2FA() {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
    })

    if (error) {
        return { error: error.message }
    }

    return {
        id: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri
    }
}

/**
 * Verify and activate 2FA
 */
export async function verify2FA(factorId: string, code: string) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.mfa.challenge({ factorId })

    if (error) {
        return { error: error.message }
    }

    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: data.id,
        code
    })

    if (verifyError) {
        return { error: verifyError.message }
    }

    revalidatePath('/profile')
    return { success: true, message: '2FA enabled successfully' }
}

/**
 * Disable 2FA for the current user
 */
export async function disable2FA(factorId: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.mfa.unenroll({ factorId })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/profile')
    return { success: true, message: '2FA disabled successfully' }
}

/**
 * Get 2FA factors for the current user
 */
export async function get2FAFactors() {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.mfa.listFactors()

    if (error) {
        return { error: error.message }
    }

    return { factors: data.totp }
}

/**
 * Get user preferences
 */
export async function getUserPreferences() {
    return { timezone: 'UTC' }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(timezone: string) {
    // Placeholder for future preference storage
    return { success: true }
}
