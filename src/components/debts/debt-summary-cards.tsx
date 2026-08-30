import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Wallet, TrendingDown } from 'lucide-react'
import type { DebtSummary } from '@/types/debts'

interface DebtSummaryCardsProps {
    summary: DebtSummary
    currency?: string
    locale?: string
}

export function DebtSummaryCards({ summary, currency = 'USD', locale = 'en-US' }: DebtSummaryCardsProps) {
    const fmt = new Intl.NumberFormat(locale, { style: 'currency', currency })

    const payoffCreditors = summary.projections.filter((p) => p.payoffMonth)
    const nextPayoff = payoffCreditors.sort((a, b) => (a.payoffMonth! < b.payoffMonth! ? -1 : 1))[0]
    const totalProjectedInterest = summary.projections.reduce((sum, p) => sum + p.totalInterest, 0)

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Total Debt
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{fmt.format(summary.totalBalance)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Across {summary.creditorCount} creditor{summary.creditorCount === 1 ? '' : 's'}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Minimum Monthly Payments
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{fmt.format(summary.totalMinPayment)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {nextPayoff ? `Next payoff: ${nextPayoff.payoffMonth}` : 'No projected payoff yet'}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Projected Interest
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{fmt.format(totalProjectedInterest)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        At minimum payments, over the life of each debt
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
