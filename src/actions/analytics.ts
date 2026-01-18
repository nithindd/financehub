'use server'

import { createClient } from '@/utils/supabase/server'

export interface VendorSpend {
    vendor: string
    amount: number
}

export interface CategorySpend {
    category: string
    amount: number
}

export interface MonthlyFinancials {
    month: string // "Jan 2024"
    income: number
    expenses: number
    savings: number
}

/**
 * Get top vendors by spend for the given date range (default: all time)
 */
export async function getVendorSpend(startDate?: Date, endDate?: Date): Promise<VendorSpend[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    let query = supabase
        .from('transactions')
        .select(`
            description,
            date,
            journal_entries!inner (
                amount,
                entry_type,
                accounts!inner (
                    type
                )
            )
        `)
        .eq('user_id', user.id)
        .eq('journal_entries.entry_type', 'DEBIT')
        .eq('journal_entries.accounts.type', 'EXPENSE')

    // Apply date filters if provided
    if (startDate) query = query.gte('date', startDate.toISOString())
    if (endDate) query = query.lte('date', endDate.toISOString())

    const { data, error } = await query

    if (error) {
        console.error('Error fetching vendor spend:', error)
        return []
    }

    // Aggregate by description (Vendor)
    const vendorMap = new Map<string, number>()

    data.forEach((tx: any) => {
        // Clean description to get vendor name (simple heuristic)
        // If description is "Amazon - Office Supplies", maybe just take "Amazon"?
        // For now, take full description as the vendor name
        const vendor = tx.description.trim()

        // Sum debit amounts for expense accounts
        const amount = tx.journal_entries.reduce((sum: number, entry: any) => sum + parseFloat(entry.amount), 0)

        vendorMap.set(vendor, (vendorMap.get(vendor) || 0) + amount)
    })

    // Convert to array and sort
    const result = Array.from(vendorMap.entries())
        .map(([vendor, amount]) => ({ vendor, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10) // Top 10

    return result
}

/**
 * Get spending by category (Account Name)
 */
export async function getCategorySpend(startDate?: Date, endDate?: Date): Promise<CategorySpend[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    let query = supabase
        .from('journal_entries')
        .select(`
            amount,
            accounts!inner (
                name,
                type
            ),
            transactions!inner (
                date,
                user_id
            )
        `)
        .eq('transactions.user_id', user.id)
        .eq('accounts.type', 'EXPENSE')
        .eq('entry_type', 'DEBIT')

    if (startDate) query = query.gte('transactions.date', startDate.toISOString())
    if (endDate) query = query.lte('transactions.date', endDate.toISOString())

    const { data, error } = await query

    if (error) {
        console.error('Error fetching category spend:', error)
        return []
    }

    const categoryMap = new Map<string, number>()

    data.forEach((entry: any) => {
        const category = entry.accounts.name
        const amount = parseFloat(entry.amount)
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount)
    })

    return Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
}

/**
 * Get monthly income, expenses, and savings
 */
export async function getMonthlyFinancials(startDate?: Date, endDate?: Date): Promise<MonthlyFinancials[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Fetch all relevant entries
    let query = supabase
        .from('journal_entries')
        .select(`
            amount,
            entry_type,
            accounts!inner (
                type
            ),
            transactions!inner (
                date,
                user_id
            )
        `)
        .eq('transactions.user_id', user.id)

    // Optimizing for Income and Expense only for this chart
    // We could filter accounts.type in ('INCOME', 'EXPENSE') but Supabase postgrest syntax is simpler like this

    if (startDate) query = query.gte('transactions.date', startDate.toISOString())
    if (endDate) query = query.lte('transactions.date', endDate.toISOString())

    const { data, error } = await query

    if (error) {
        console.error('Error fetching monthly financials:', error)
        return []
    }

    const monthlyData = new Map<string, { income: number, expenses: number }>()

    data.forEach((entry: any) => {
        const date = new Date(entry.transactions.date)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) // "Jan 2024"
        const sortKey = date.toISOString().slice(0, 7) // "2024-01" for sorting

        if (!monthlyData.has(sortKey)) {
            monthlyData.set(sortKey, { income: 0, expenses: 0 })
        }

        const current = monthlyData.get(sortKey)!
        const amount = parseFloat(entry.amount)
        const type = entry.accounts.type
        const entryType = entry.entry_type

        if (type === 'INCOME') {
            // Income is Credit normal
            if (entryType === 'CREDIT') current.income += amount
            else current.income -= amount
        } else if (type === 'EXPENSE') {
            // Expense is Debit normal
            if (entryType === 'DEBIT') current.expenses += amount
            else current.expenses -= amount
        }
    })

    // Sort by date key and format
    const sortedKeys = Array.from(monthlyData.keys()).sort()

    let cumulativeSavings = 0

    return sortedKeys.map(key => {
        const data = monthlyData.get(key)!
        const savings = data.income - data.expenses
        cumulativeSavings += savings // Not used in bar chart but maybe useful

        // Format key "2024-01" back to "Jan 2024"
        const [year, month] = key.split('-')
        const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

        return {
            month: label,
            income: data.income,
            expenses: data.expenses,
            savings: savings
        }
    })
}
