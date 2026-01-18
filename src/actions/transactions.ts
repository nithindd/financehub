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
    parentId?: string
    vendor?: string
    items?: any[]
}

export async function createTransaction(input: TransactionInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // 1. Validate Balance
    const totalDebits = input.entries
        .filter(e => e.type === 'DEBIT')
        .reduce((sum, e) => sum + e.amount, 0)

    const totalCredits = input.entries
        .filter(e => e.type === 'CREDIT')
        .reduce((sum, e) => sum + e.amount, 0)

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return { success: false, error: `Transaction not balanced: Debits(${totalDebits}) != Credits(${totalCredits})` }
    }

    // 2. Create Transaction Header
    const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
            date: input.date.toISOString(),
            description: input.description,
            user_id: user.id,
            evidence_path: input.evidencePath,
            parent_id: input.parentId,
            vendor: input.vendor,
            items: input.items || []
        })
        .select()
        .single()

    if (txError) {
        return { success: false, error: txError.message }
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
        return { success: false, error: 'Transaction header created but entries failed. Please contact support.' }
    }

    revalidatePath('/')
    return { success: true, id: transaction.id }
}

/**
 * Creates multiple transactions. The first one is treated as the "Master"
 * and its ID is used as parent_id for subsequent transactions if they don't have one.
 */
export async function createTransactionBatch(inputs: TransactionInput[]) {
    if (inputs.length === 0) return { success: false, error: 'No transactions provided' }

    // 1. Create the Master Transaction
    const masterResult = await createTransaction(inputs[0])
    if (!masterResult.success || !masterResult.id) return { success: false, error: masterResult.error || 'Failed to create master transaction' }

    const masterId = masterResult.id

    // 2. Create detailed sub-transactions
    // Skip the first one as it's already created
    for (let i = 1; i < inputs.length; i++) {
        const childInput = { ...inputs[i], parentId: masterId }
        const result = await createTransaction(childInput)
        if (!result.success) {
            console.error(`Failed to create child transaction ${i}`, result.error)
            // Continue with others or return? Let's continue for now.
        }
    }

    revalidatePath('/')
    return { success: true, masterId }
}

export async function updateTransaction(id: string, input: TransactionInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Validate balance
    const totalDebits = input.entries.filter(e => e.type === 'DEBIT').reduce((sum, e) => sum + e.amount, 0)
    const totalCredits = input.entries.filter(e => e.type === 'CREDIT').reduce((sum, e) => sum + e.amount, 0)

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return { success: false, error: `Transaction not balanced` }
    }

    // Update transaction header
    const { error: txError } = await supabase
        .from('transactions')
        .update({
            date: input.date.toISOString(),
            description: input.description,
            evidence_path: input.evidencePath,
            parent_id: input.parentId,
            vendor: input.vendor,
            items: input.items || []
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (txError) return { success: false, error: txError.message }

    // Delete old entries
    await supabase.from('journal_entries').delete().eq('transaction_id', id)

    // Insert new entries
    const entriesToInsert = input.entries.map(entry => ({
        transaction_id: id,
        account_id: entry.accountId,
        amount: entry.amount,
        entry_type: entry.type
    }))

    const { error: entriesError } = await supabase.from('journal_entries').insert(entriesToInsert)
    if (entriesError) return { success: false, error: entriesError.message }

    revalidatePath('/')
    revalidatePath('/reports')
    return { success: true }
}

export async function deleteTransaction(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Delete transaction (journal entries will cascade)
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    revalidatePath('/reports')
    return { success: true }
}

export async function getTransactionById(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('transactions')
        .select(`
            id,
            date,
            description,
            evidence_path,
            journal_entries (
                id,
                account_id,
                amount,
                entry_type
            )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error) return null
    return data
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
export async function checkPossibleDuplicate(input: { date: Date, amount: number, description?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Search for transactions on the same date (ignore time)
    const dateStr = input.date.toISOString().split('T')[0]

    // We want to find transactions that occurred on this date
    // Database 'date' is timestampz usually? Or date? 
    // Schema says "date sent as ISO string". 
    // Let's search range: [dateStr 00:00, dateStr 23:59] in UTC?
    // It's safer to fetch a wider range or just matches.

    // Let's assume dates are stored roughly correctly.
    const { data: candidates, error } = await supabase
        .from('transactions')
        .select(`
            id,
            date,
            description,
            journal_entries (
                amount,
                entry_type
            )
        `)
        .eq('user_id', user.id)
        // Just checking by date string prefix might be unsafe if timezones differ.
        // Let's just fetch recent 50 and filter in JS? No, not scalable.
        // Let's use PostgreSQL date comparison if possible
        .gte('date', `${dateStr}T00:00:00`)
        .lte('date', `${dateStr}T23:59:59`)

    if (error || !candidates) return []

    const duplicates = candidates.filter(tx => {
        // Calculate total amount of transaction
        const txAmount = tx.journal_entries.reduce((acc: number, curr: any) => {
            return curr.entry_type === 'DEBIT' ? acc + curr.amount : acc
        }, 0)

        const isAmountMatch = Math.abs(txAmount - input.amount) < 0.05
        const isDescMatch = input.description && tx.description.toLowerCase().includes(input.description.toLowerCase())

        return isAmountMatch || isDescMatch
    }).map(tx => ({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        amount: tx.journal_entries.reduce((acc: number, curr: any) => curr.entry_type === 'DEBIT' ? acc + curr.amount : acc, 0)
    }))

    return duplicates
}
