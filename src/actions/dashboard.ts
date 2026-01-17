'use server'

import { createClient } from '@/utils/supabase/server'

export interface DashboardMetrics {
    totalIncome: number
    totalExpenses: number
    netProfit: number
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { totalIncome: 0, totalExpenses: 0, netProfit: 0 }
    }

    // Fetch all journal entries with their associated account type
    const { data, error } = await supabase
        .from('journal_entries')
        .select(`
            amount,
            entry_type,
            accounts!inner (
                type
            )
        `)

    if (error) {
        console.error('Error fetching dashboard metrics:', error)
        return { totalIncome: 0, totalExpenses: 0, netProfit: 0 }
    }

    let totalIncome = 0
    let totalExpenses = 0

    data.forEach((entry: any) => {
        const amount = parseFloat(entry.amount)
        const type = entry.accounts.type
        const entryType = entry.entry_type

        if (type === 'INCOME') {
            if (entryType === 'CREDIT') totalIncome += amount
            else totalIncome -= amount
        } else if (type === 'EXPENSE') {
            if (entryType === 'DEBIT') totalExpenses += amount
            else totalExpenses -= amount
        }
    })

    return {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses
    }
}
