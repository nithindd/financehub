'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { computeDebtSummary, type CreditorWithLedger } from '@/lib/debt-engine'
import { getContextMemberIds } from '@/lib/household-context'
import type { Creditor, DebtType, LedgerMovement, PaymentPlanSegment } from '@/types/debts'

export interface CreditorInput {
    accountId: string
    name: string
    creditorOrg?: string
    debtType: DebtType
    apr: number
    openingBalance: number
    openingDate: string
    minPayment: number
    creditLimit?: number
    dueDay?: number
    notes?: string
    promoApr?: number
    promoStartMonth?: string
    promoEndMonth?: string
}

function toCreditor(row: any): Creditor {
    return {
        id: row.id,
        userId: row.user_id,
        accountId: row.account_id,
        name: row.name,
        creditorOrg: row.creditor_org,
        debtType: row.debt_type,
        apr: Number(row.apr),
        openingBalance: Number(row.opening_balance),
        openingDate: row.opening_date,
        minPayment: Number(row.min_payment),
        creditLimit: row.credit_limit != null ? Number(row.credit_limit) : null,
        dueDay: row.due_day,
        notes: row.notes,
        promoApr: row.promo_apr != null ? Number(row.promo_apr) : null,
        promoStartMonth: row.promo_start_month,
        promoEndMonth: row.promo_end_month,
    }
}

export async function createCreditor(input: CreditorInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data, error } = await supabase
        .from('creditors')
        .insert({
            user_id: user.id,
            account_id: input.accountId,
            name: input.name,
            creditor_org: input.creditorOrg,
            debt_type: input.debtType,
            apr: input.apr,
            opening_balance: input.openingBalance,
            opening_date: input.openingDate,
            min_payment: input.minPayment,
            credit_limit: input.creditLimit,
            due_day: input.dueDay,
            notes: input.notes,
            promo_apr: input.promoApr,
            promo_start_month: input.promoStartMonth,
            promo_end_month: input.promoEndMonth,
        })
        .select()
        .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/debts')
    return { success: true, id: data.id }
}

export async function updateCreditor(id: string, input: Partial<CreditorInput>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
        .from('creditors')
        .update({
            name: input.name,
            creditor_org: input.creditorOrg,
            debt_type: input.debtType,
            apr: input.apr,
            min_payment: input.minPayment,
            credit_limit: input.creditLimit,
            due_day: input.dueDay,
            notes: input.notes,
            promo_apr: input.promoApr,
            promo_start_month: input.promoStartMonth,
            promo_end_month: input.promoEndMonth,
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/debts')
    return { success: true }
}

export async function deleteCreditor(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
        .from('creditors')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/debts')
    return { success: true }
}

/**
 * Scoped to whichever profile is currently active (src/lib/household-context.ts):
 * just the signed-in user's own creditors in their individual view, or every
 * household member's shared creditors when a household profile is selected. RLS
 * still enforces that a member's rows only actually come back if they've opted
 * `share_creditors_with_household` on — see docs/CONSOLIDATION_ANALYSIS.md 6a.
 */
export async function listCreditors(): Promise<Creditor[]> {
    const supabase = await createClient()
    const memberIds = await getContextMemberIds()
    if (memberIds.length === 0) return []

    const { data, error } = await supabase
        .from('creditors')
        .select('*')
        .in('user_id', memberIds)
        .order('created_at', { ascending: true })

    if (error || !data) return []
    return data.map(toCreditor)
}

/**
 * Builds the ledger movement history for a creditor's linked account. A CREDIT to a
 * LIABILITY account increases the debt (a new charge); a DEBIT decreases it (a
 * payment) — see docs/CONSOLIDATION_ANALYSIS.md section 2.
 */
async function loadLedgerMovements(supabase: Awaited<ReturnType<typeof createClient>>, accountId: string): Promise<LedgerMovement[]> {
    const { data, error } = await supabase
        .from('journal_entries')
        .select('amount, entry_type, transactions!inner(date)')
        .eq('account_id', accountId)
        .order('transactions(date)', { ascending: true })

    if (error || !data) return []

    return data.map((row: any) => ({
        date: row.transactions.date,
        delta: row.entry_type === 'CREDIT' ? Number(row.amount) : -Number(row.amount),
    }))
}

async function loadPaymentPlanSegments(supabase: Awaited<ReturnType<typeof createClient>>, creditorId: string): Promise<PaymentPlanSegment[]> {
    const { data, error } = await supabase
        .from('payment_plan_segments')
        .select('*')
        .eq('creditor_id', creditorId)
        .order('created_at', { ascending: true })

    if (error || !data) return []

    return data.map((row: any) => ({
        id: row.id,
        creditorId: row.creditor_id,
        startMonth: row.start_month,
        endMonth: row.end_month,
        amount: Number(row.amount),
    }))
}

export async function getDebtSummary(asOfDate: string = new Date().toISOString().slice(0, 10)) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const creditors = await listCreditors()

    const creditorsWithLedger: CreditorWithLedger[] = await Promise.all(
        creditors.map(async (creditor) => ({
            creditor,
            movements: await loadLedgerMovements(supabase, creditor.accountId),
            segments: await loadPaymentPlanSegments(supabase, creditor.id),
        }))
    )

    return computeDebtSummary(creditorsWithLedger, asOfDate)
}
