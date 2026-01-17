'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface JournalEntryInput {
    accountId: string
    amount: number
    type: 'DEBIT' | 'CREDIT'
}

export interface TransactionInput {
    date: Date
    description: string
    entries: JournalEntryInput[]
    evidencePath?: string
}

export async function createTransaction(input: TransactionInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Validate Balance
    const totalDebits = input.entries
        .filter(e => e.type === 'DEBIT')
        .reduce((sum, e) => sum + e.amount, 0)

    const totalCredits = input.entries
        .filter(e => e.type === 'CREDIT')
        .reduce((sum, e) => sum + e.amount, 0)

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return { error: `Transaction not balanced: Debits(${totalDebits}) != Credits(${totalCredits})` }
    }

    // 2. Create Transaction Header
    const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
            date: input.date.toISOString(),
            description: input.description,
            user_id: user.id,
            evidence_path: input.evidencePath
        })
        .select()
        .single()

    if (txError) {
        return { error: txError.message }
    }

    // 3. Create Journal Entries
    const entriesToInsert = input.entries.map(entry => ({
        transaction_id: transaction.id,
        account_id: entry.accountId,
        amount: entry.amount,
        entry_type: entry.type
    }))

    const { error: entriesError } = await supabase
        .from('journal_entries')
        .insert(entriesToInsert)

    if (entriesError) {
        // In a real app we might roll back here, but simplified for now
        console.error('Failed to insert entries', entriesError)
        return { error: 'Transaction header created but entries failed. Please contact support.' }
    }

    revalidatePath('/')
    return { success: true }
}

export async function getRecentTransactions() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('transactions')
        .select(`
      id,
      date,
      description,
      amount:journal_entries(amount, entry_type)
    `)
        .order('date', { ascending: false })
        .limit(10)

    if (error) return []

    // Simplify for display: generic amount (sum of splits / 2 usually, or just total magnitude)
    return data.map(tx => {
        // A transaction's "Amount" is ambiguous in double entry. 
        // We'll calculate the total movement (Sum of debits)
        const total = tx.amount.reduce((acc: number, curr: any) => {
            return curr.entry_type === 'DEBIT' ? acc + curr.amount : acc
        }, 0)
        return {
            ...tx,
            displayAmount: total
        }
    })
}
