'use server'

import { createClient } from '@/utils/supabase/server'

export interface UserPreferences {
    id: string
    user_id: string
    timezone: string
    created_at: string
    updated_at: string
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (error) {
        // If no preferences exist, create default
        if (error.code === 'PGRST116') {
            const { data: newPrefs } = await supabase
                .from('user_preferences')
                .insert({ user_id: user.id, timezone: 'UTC' })
                .select()
                .single()
            return newPrefs
        }
        return null
    }

    return data
}

export async function updateUserPreferences(timezone: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('user_preferences')
        .upsert({
            user_id: user.id,
            timezone: timezone
        }, {
            onConflict: 'user_id'
        })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
