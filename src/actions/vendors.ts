'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface VendorMapping {
    id: string
    user_id: string
    vendor_pattern: string
    account_id: string
    created_at: string
}

export async function getVendorMappings(): Promise<VendorMapping[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('vendor_mappings')
        .select('*')
        .eq('user_id', user.id)
        .order('vendor_pattern')

    if (error) {
        console.error('Error fetching vendor mappings:', error)
        return []
    }

    return data || []
}

export async function createVendorMapping(vendorPattern: string, accountId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('vendor_mappings')
        .insert({
            user_id: user.id,
            vendor_pattern: vendorPattern.toLowerCase().trim(),
            account_id: accountId
        })

    if (error) return { error: error.message }

    revalidatePath('/settings/vendors')
    return { success: true }
}

export async function deleteVendorMapping(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('vendor_mappings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/settings/vendors')
    return { success: true }
}

export async function suggestCategoryForVendor(vendorName: string): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('vendor_mappings')
        .select('account_id, vendor_pattern')
        .eq('user_id', user.id)

    if (!data || data.length === 0) return null

    // Case-insensitive partial match
    const vendorLower = vendorName.toLowerCase()
    const match = data.find(mapping =>
        vendorLower.includes(mapping.vendor_pattern.toLowerCase())
    )

    return match?.account_id || null
}
