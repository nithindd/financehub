'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteUserAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const adminClient = createAdminClient()

    // Delete the user from auth.users. 
    // This should cascade to public tables if configured correctly with ON DELETE CASCADE foreign keys.
    const { error } = await adminClient.auth.admin.deleteUser(user.id)

    if (error) {
        console.error('Error deleting user:', error)
        return { error: error.message }
    }

    // Sign out the session
    await supabase.auth.signOut()

    // We can't use redirect in a try/catch block usually if it throws, 
    // so we return success and let client redirect or redirect here if strictly server action.
    // The client component will handle the redirect to / after success.
    return { success: true }
}
