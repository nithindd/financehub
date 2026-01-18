import { getFinancialReport } from '@/actions/reports'
import { ReportFilters } from '@/components/reports/report-filters'
import { ReportSummary } from '@/components/reports/report-summary'
import { TransactionTable } from '@/components/reports/transaction-table'
import { ExportActions } from '@/components/reports/export-actions'
import { startOfMonth, endOfMonth } from 'date-fns'
import { createClient } from '@/utils/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'

// Server Component
export default async function ReportsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <DashboardShell>
                <div className="p-8">Please log in to view reports.</div>
            </DashboardShell>
        )
    }

    // Await searchParams before using properties
    const params = await searchParams

    // Default to this month
    const today = new Date()
    const defaultStart = startOfMonth(today).toISOString().split('T')[0]
    const defaultEnd = endOfMonth(today).toISOString().split('T')[0]

    const startDateStr = (params.start as string) || defaultStart
    const endDateStr = (params.end as string) || defaultEnd

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    // Fetch data
    const reportData = await getFinancialReport(startDate, endDate)

    if ('error' in reportData) {
        return (
            <DashboardShell>
                <div className="p-8 text-red-600">Error: {reportData.error}</div>
            </DashboardShell>
        )
    }

    return (
        <DashboardShell>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground">View and export your transaction history.</p>
                </div>

                <ReportFilters />

                <ReportSummary summary={reportData.summary} />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
                    <h2 className="text-lg font-semibold">Transactions</h2>
                    <ExportActions
                        data={reportData.transactions}
                        summary={reportData.summary}
                        startDate={startDate}
                        endDate={endDate}
                        defaultEmail={user?.email}
                    />
                </div>

                <TransactionTable transactions={reportData.transactions} />
            </div>
        </DashboardShell>
    )
}
