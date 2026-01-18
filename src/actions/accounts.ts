'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'

export interface Account {
    id: string
    name: string
    type: AccountType
}

export interface AccountBalance extends Account {
    balance: number
}

export async function getAccountBalances(): Promise<AccountBalance[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Fetch accounts with their journal entries
    const { data, error } = await supabase
        .from('accounts')
        .select(`
            *,
            journal_entries (
                amount,
                entry_type
            )
        `)
        .order('name')

    if (error) {
        console.error('Error fetching account balances:', error)
        return []
    }

    return data.map((account: any) => {
        let balance = 0

        // Calculate balance based on account type normal side
        // Asset/Expense: Debit is +
        // Liab/Equity/Income: Credit is +

        account.journal_entries.forEach((entry: any) => {
            const amount = parseFloat(entry.amount)
            if (account.type === 'ASSET' || account.type === 'EXPENSE') {
                if (entry.entry_type === 'DEBIT') balance += amount
                else balance -= amount
            } else {
                if (entry.entry_type === 'CREDIT') balance += amount
                else balance -= amount
            }
        })

        return {
            id: account.id,
            name: account.name,
            type: account.type,
            balance: balance
        }
    })
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

export async function updateAccount(id: string, name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('accounts')
        .update({ name })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/')
    revalidatePath('/settings/categories')
    return { success: true }
}

export async function deleteAccount(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if account has transactions
    const { count } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', id)

    if (count && count > 0) {
        return { error: `Cannot delete account with ${count} existing transactions` }
    }

    const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/')
    revalidatePath('/settings/categories')
    return { success: true }
}

