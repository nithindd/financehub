import { createClient } from '@/utils/supabase/server'
import { getFinancialReport } from '@/actions/reports'
import { ReportFilters } from '@/components/reports/report-filters'
import { ReportSummary } from '@/components/reports/report-summary'
import { TransactionTable } from '@/components/reports/transaction-table'
import { ExportActions } from '@/components/reports/export-actions'
import { startOfMonth, endOfMonth } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

// Server Component
export default async function ReportsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8">Please log in to view reports.</div>
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
        return <div className="p-8 text-red-600">Error: {reportData.error}</div>
    }



    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="ghost" size="sm" asChild className="mr-2">
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold tracking-tight text-primary">Financial Reports</h1>
            </header>

            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">

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

            </main>
        </div>
    )
}
