/**
 * Pure debt-payoff compute engine. No framework, no I/O — takes plain data in,
 * returns plain data out, so it can run in a Server Action, a background job, or a
 * client component without a second port (see docs/CONSOLIDATION_ANALYSIS.md
 * section 6 on the "two compute implementations" problem this is meant to avoid).
 *
 * Ported from PR12_DebtDashboard's scripts/dashboard_template.html compute engine.
 * Only the single-creditor amortization path is ported so far; the 6 payoff-strategy
 * simulators (avalanche/snowball/hybrid/dollar/promo_aware/optimal) and What-If
 * scenarios are Phase 2/3 work — see docs/CONSOLIDATION_ANALYSIS.md.
 */

import type {
    Creditor,
    CreditorProjection,
    CreditorProjectionPoint,
    LedgerMovement,
    PaymentPlanSegment,
} from '@/types/debts'

export const HORIZON_MONTHS = 360 // 30 years, matches the original DebtDashboard constant

function toMonth(dateStr: string): string {
    return dateStr.slice(0, 7) // 'YYYY-MM'
}

function addMonths(month: string, n: number): string {
    const [y, m] = month.split('-').map(Number)
    const total = y * 12 + (m - 1) + n
    const ny = Math.floor(total / 12)
    const nm = (total % 12) + 1
    return `${ny}-${String(nm).padStart(2, '0')}`
}

function monthLessOrEqual(a: string, b: string): boolean {
    return a <= b
}

/** Balance of a creditor's linked account as of a given date, from the ledger. */
export function balanceAsOf(
    openingBalance: number,
    openingDate: string,
    movements: LedgerMovement[],
    asOfDate: string
): number {
    let balance = openingBalance
    for (const m of movements) {
        if (m.date >= openingDate && m.date <= asOfDate) {
            balance += m.delta
        }
    }
    return balance
}

export function isPromoActive(creditor: Creditor, month: string): boolean {
    if (creditor.promoApr == null || !creditor.promoStartMonth) return false
    if (month < creditor.promoStartMonth) return false
    if (creditor.promoEndMonth && month > creditor.promoEndMonth) return false
    return true
}

export function monthlyRateFor(creditor: Creditor, month: string): number {
    const apr = isPromoActive(creditor, month) ? creditor.promoApr! : creditor.apr
    return apr / 12 / 100
}

/** Last-defined-wins: pass segments already ordered oldest-created first. */
export function planAmountForMonth(
    creditor: Creditor,
    segments: PaymentPlanSegment[],
    month: string
): number {
    let amount: number | null = null
    for (const seg of segments) {
        const covers = monthLessOrEqual(seg.startMonth, month) && (!seg.endMonth || monthLessOrEqual(month, seg.endMonth))
        if (covers) amount = seg.amount
    }
    return amount ?? creditor.minPayment
}

/**
 * Amortizes a single creditor forward from its current balance until it reaches
 * $0 or HORIZON_MONTHS is exhausted, whichever comes first.
 */
export function projectCreditor(
    creditor: Creditor,
    currentBalance: number,
    startMonth: string,
    segments: PaymentPlanSegment[]
): CreditorProjection {
    const points: CreditorProjectionPoint[] = []
    let balance = currentBalance
    let totalInterest = 0
    let payoffMonth: string | null = null

    for (let i = 0; i < HORIZON_MONTHS && balance > 0.005; i++) {
        const month = addMonths(startMonth, i)
        const rate = monthlyRateFor(creditor, month)
        const interest = balance * rate
        balance += interest
        totalInterest += interest

        const planned = planAmountForMonth(creditor, segments, month)
        const payment = Math.min(planned, balance)
        balance -= payment

        points.push({ month, balance: Math.max(balance, 0), interestAccrued: interest, paymentApplied: payment })

        if (balance <= 0.005 && !payoffMonth) {
            payoffMonth = month
        }
    }

    return {
        creditorId: creditor.id,
        startingBalance: currentBalance,
        points,
        payoffMonth,
        totalInterest,
    }
}

export interface CreditorWithLedger {
    creditor: Creditor
    movements: LedgerMovement[]
    segments: PaymentPlanSegment[]
}

/** Top-level entry point: current balances + forward projections for every creditor. */
export function computeDebtSummary(creditorsWithLedger: CreditorWithLedger[], asOfDate: string) {
    const startMonth = toMonth(asOfDate)
    const projections: CreditorProjection[] = []
    let totalBalance = 0
    let totalMinPayment = 0

    for (const { creditor, movements, segments } of creditorsWithLedger) {
        const currentBalance = balanceAsOf(creditor.openingBalance, creditor.openingDate, movements, asOfDate)
        totalBalance += currentBalance
        totalMinPayment += creditor.minPayment
        projections.push(projectCreditor(creditor, currentBalance, startMonth, segments))
    }

    return {
        asOf: asOfDate,
        totalBalance,
        totalMinPayment,
        creditorCount: creditorsWithLedger.length,
        projections,
    }
}
