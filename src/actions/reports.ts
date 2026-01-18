'use server'

import { createClient } from '@/utils/supabase/server'

export interface JournalEntryDetail {
    amount: number
    type: 'DEBIT' | 'CREDIT'
    accountName: string
    accountType: string
}

export interface ReportTransaction {
    id: string
    date: string
    description: string
    amount: number
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    category: string // Account name
    evidencePath?: string
    parentId?: string
    journalEntries: JournalEntryDetail[]
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
            parent_id,
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
            evidencePath: tx.evidence_path,
            parentId: tx.parent_id,
            journalEntries: tx.journal_entries.map((e: any) => ({
                amount: parseFloat(e.amount),
                type: e.entry_type as 'DEBIT' | 'CREDIT',
                accountName: e.accounts.name,
                accountType: e.accounts.type
            }))
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

export async function sendReportEmail(formData: FormData) {
    const email = formData.get('email') as string
    const summary = formData.get('summary') as string
    const period = formData.get('period') as string
    const includeReceipts = formData.get('includeReceipts') === 'true'
    const receiptPathsJson = formData.get('receiptPaths') as string
    const files = formData.getAll('files') as File[]

    // In a real app, use Resend/SendGrid/AWS SES here
    console.log(`[EMAIL SERVICE] Sending report to ${email}`)

    // Check for API Key
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
        console.warn('RESEND_API_KEY not found. Email simulation only.')
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        return { success: true, message: 'Simulation: Key missing' }
    }

    try {
        const { Resend } = await import('resend')
        const resend = new Resend(resendApiKey)
        const supabase = await createClient()

        // Convert files (PDF/CSV) to attachments format for Resend
        const attachments: any[] = await Promise.all(
            files.map(async (file) => ({
                filename: file.name,
                content: Buffer.from(await file.arrayBuffer())
            }))
        )

        // Handle Receipts
        let receiptPaths: string[] = []
        if (includeReceipts && receiptPathsJson) {
            receiptPaths = JSON.parse(receiptPathsJson)
        }

        const cappedReceiptPaths = receiptPaths.slice(0, 10)
        const hasMoreReceipts = receiptPaths.length > 10

        // Download and attach receipts
        if (cappedReceiptPaths.length > 0) {
            const receiptAttachments = await Promise.all(
                cappedReceiptPaths.map(async (path) => {
                    const { data, error } = await supabase.storage.from('evidence').download(path)
                    if (error || !data) {
                        console.error('Error downloading receipt:', path, error)
                        return null
                    }
                    return {
                        filename: path.split('/').pop(),
                        content: Buffer.from(await data.arrayBuffer())
                    }
                })
            )

            // Filter out nulls and add to main attachments
            receiptAttachments.forEach(att => {
                if (att) attachments.push(att)
            })
        }

        const fromAddress = process.env.EMAIL_FROM || 'FinanceHub <onboarding@resend.dev>'

        const moreReceiptsNote = hasMoreReceipts
            ? `<p style="color: #666; font-size: 0.9em; margin-top: 10px; border-top: 1px solid #eee; pt: 10px;">
                Note: This report has more than 10 receipts. For security and size reasons, only the first 10 have been attached. 
                Please view the rest in the FinanceHub dashboard or filter for a smaller time frame.
               </p>`
            : ''

        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: [email],
            subject: `Financial Report: ${period}`,
            html: `
                <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
                    <h1>Your Financial Report</h1>
                    <p>Attached is your requested report for the period: <strong>${period}</strong>.</p>
                    <p>Summary:</p>
                    <ul>
                        <li>Included Receipt Images: ${includeReceipts ? 'Yes' : 'No'}</li>
                        <li>Files Attached: ${attachments.length}</li>
                    </ul>
                    ${moreReceiptsNote}
                </div>
            `,
            attachments: attachments
        })

        if (error) {
            console.error('Resend Error:', error)
            return { error: error.message }
        }

        return { success: true }

    } catch (err) {
        console.error('Email Send Exception:', err)
        return { error: 'Failed to send email' }
    }
}
