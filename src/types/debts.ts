export type DebtType = 'credit_card' | 'loan' | 'medical' | 'other'

export interface Creditor {
    id: string
    userId: string
    accountId: string
    name: string
    creditorOrg?: string | null
    debtType: DebtType
    apr: number
    openingBalance: number
    openingDate: string // 'YYYY-MM-DD'
    minPayment: number
    creditLimit?: number | null
    dueDay?: number | null
    notes?: string | null
    promoApr?: number | null
    promoStartMonth?: string | null // 'YYYY-MM'
    promoEndMonth?: string | null // 'YYYY-MM' or null = never expires
}

export interface PaymentPlanSegment {
    id: string
    creditorId: string
    startMonth: string // 'YYYY-MM'
    endMonth: string | null
    amount: number
}

/** A single ledger movement against a creditor's linked account, in date order. */
export interface LedgerMovement {
    date: string // 'YYYY-MM-DD'
    /** Positive = balance increase (a charge/CREDIT to the liability), negative = decrease (a payment/DEBIT). */
    delta: number
}

export interface CreditorProjectionPoint {
    month: string // 'YYYY-MM'
    balance: number
    interestAccrued: number
    paymentApplied: number
}

export interface CreditorProjection {
    creditorId: string
    startingBalance: number
    points: CreditorProjectionPoint[]
    payoffMonth: string | null // null if it doesn't reach $0 within the horizon
    totalInterest: number
}

export interface DebtSummary {
    asOf: string // 'YYYY-MM-DD'
    totalBalance: number
    totalMinPayment: number
    creditorCount: number
    projections: CreditorProjection[]
}
