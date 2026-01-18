'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendEmail } from '@/lib/email'

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

    // Notify Admin about deletion
    try {
        const adminEmail = process.env.ADMIN_EMAIL
        if (adminEmail) {
            await sendEmail({
                to: adminEmail,
                subject: 'User Account Deleted - FinanceHub',
                html: `
                    <h1>User Deleted Account</h1>
                    <p><strong>User ID:</strong> ${user.id}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p>The user has requested to delete their account.</p>
                `
            })
        }
    } catch (err) {
        console.error('Error sending admin deletion notification:', err)
    }

    // Sign out the session
    await supabase.auth.signOut()

    // We can't use redirect in a try/catch block usually if it throws, 
    // so we return success and let client redirect or redirect here if strictly server action.
    // The client component will handle the redirect to / after success.
    return { success: true }
}
