'use server'

import { createClient } from '@/utils/supabase/server'

export interface ReportTransaction {
    id: string
    date: string
    description: string
    amount: number
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    category: string // Account name
    evidencePath?: string
}

export interface ReportSummary {
    totalIncome: number
    totalExpenses: number
    netProfit: number
}

export interface FinancialReport {
    summary: ReportSummary
    transactions: ReportTransaction[]
}

export async function getFinancialReport(startDate: Date, endDate: Date): Promise<FinancialReport | { error: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const formattedStart = startDate.toISOString().split('T')[0]
    const formattedEnd = endDate.toISOString().split('T')[0]

    // Fetch transactions with their journal entries and account details
    // We need to determine the "Main" aspect of the transaction.
    // In a simple double entry:
    // Expense = Credit Asset (Bank) + Debit Expense (Category) -> We want the Debit side for the category.
    // Income = Debit Asset (Bank) + Credit Income (Category) -> We want the Credit side for the category.

    const { data, error } = await supabase
        .from('transactions')
        .select(`
            id,
            date,
            description,
            evidence_path,
            journal_entries (
                amount,
                entry_type,
                accounts (
                    name,
                    type
                )
            )
        `)
        .gte('date', formattedStart)
        .lte('date', formattedEnd)
        .order('date', { ascending: false })

    if (error) {
        console.error('Report Fetch Error:', error)
        return { error: error.message }
    }

    let totalIncome = 0
    let totalExpenses = 0
    const reportTransactions: ReportTransaction[] = []

    data.forEach((tx: any) => {
        // Classify transaction based on its entries
        // We look for the "Reason" entry (Income or Expense account)

        const incomeEntry = tx.journal_entries.find((e: any) => e.accounts.type === 'INCOME')
        const expenseEntry = tx.journal_entries.find((e: any) => e.accounts.type === 'EXPENSE')

        let type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'TRANSFER'
        let amount = 0
        let category = 'Transfer/Adjustment'

        if (incomeEntry) {
            type = 'INCOME'
            amount = parseFloat(incomeEntry.amount) // Income is usually CREDIT
            category = incomeEntry.accounts.name
            totalIncome += amount
        } else if (expenseEntry) {
            type = 'EXPENSE'
            amount = parseFloat(expenseEntry.amount) // Expense is usually DEBIT
            category = expenseEntry.accounts.name
            totalExpenses += amount
        } else {
            // Transfer between assets or liabilities
            // Just take the first entry's amount for display magnitude
            if (tx.journal_entries.length > 0) {
                amount = parseFloat(tx.journal_entries[0].amount)
            }
        }

        reportTransactions.push({
            id: tx.id,
            date: tx.date,
            description: tx.description,
            amount: amount,
            type: type,
            category: category,
            evidencePath: tx.evidence_path
        })
    })

    return {
        summary: {
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses
        },
        transactions: reportTransactions
    }
}

export async function sendReportEmail(email: string, reportData: any) {
    // In a real app, use Resend/SendGrid/AWS SES here
    console.log(`[EMAIL SERVICE] Sending report to ${email}`, reportData.summary)

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return { success: true }
}
