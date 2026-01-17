'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'

export interface Account {
    id: string
    name: string
    type: AccountType
}

export async function getAccounts() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching accounts:', error)
        return []
    }

    return data as Account[]
}

export async function createAccount(name: string, type: AccountType) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('accounts')
        .insert({
            name,
            type,
            user_id: user.id
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}

export async function seedDefaultAccounts() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const defaults = [
        { name: 'Cash', type: 'ASSET' },
        { name: 'Bank Account', type: 'ASSET' },
        { name: 'Credit Card', type: 'LIABILITY' },
        { name: 'Sales Income', type: 'INCOME' },
        { name: 'Office Supplies', type: 'EXPENSE' },
        { name: 'Rent', type: 'EXPENSE' },
        { name: 'Utilities', type: 'EXPENSE' },
        { name: 'Owner Equity', type: 'EQUITY' },
    ]

    // Check if accounts exist to avoid dupes (simple check)
    const { count } = await supabase.from('accounts').select('*', { count: 'exact', head: true })

    if (count && count > 0) {
        return { message: 'Accounts already exist' }
    }

    const { error } = await supabase.from('accounts').insert(
        defaults.map(acc => ({ ...acc, user_id: user.id }))
    )

    if (error) return { error: error.message }

    revalidatePath('/')
    return { success: true }
}
