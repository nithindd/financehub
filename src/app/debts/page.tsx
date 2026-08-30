import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { listCreditors, getDebtSummary } from '@/actions/debts'
import { getUserPreferences } from '@/actions/profile'
import { getActiveContext } from '@/lib/household-context'
import { DebtSummaryCards } from '@/components/debts/debt-summary-cards'
import { CreditorTable } from '@/components/debts/creditor-table'
import { AddDebtButton } from '@/components/debts/add-debt-button'
import { Users } from 'lucide-react'

export default async function DebtsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/signin')
    }

    const [creditors, summary, preferences, activeContext] = await Promise.all([
        listCreditors(),
        getDebtSummary(),
        getUserPreferences(),
        getActiveContext(),
    ])

    const { currency, locale } = preferences as any

    return (
        <DashboardShell>
            <div className="space-y-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Debts</h1>
                        <p className="text-muted-foreground">
                            {activeContext.householdId
                                ? `Combined debts shared within ${activeContext.householdName ?? 'this household'}.`
                                : 'Track balances, APRs, and minimum payments — factored automatically from your account ledger.'}
                        </p>
                    </div>
                    <AddDebtButton />
                </div>

                {activeContext.householdId && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border rounded-lg px-3 py-2">
                        <Users className="h-4 w-4" />
                        Viewing {activeContext.householdName ?? 'a household'}&apos;s shared debts. Switch back to
                        &quot;Me&quot; in the profile switcher to see only your own.
                    </div>
                )}

                {summary && <DebtSummaryCards summary={summary} currency={currency} locale={locale} />}

                <Card>
                    <CardHeader>
                        <CardTitle>Your Creditors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CreditorTable
                            creditors={creditors}
                            projections={summary?.projections ?? []}
                            currentUserId={user.id}
                            currency={currency}
                            locale={locale}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
