import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, FileText, Camera } from 'lucide-react'
import { AccountSeeder } from '@/components/account-seeder'
import { TransactionDialog } from '@/components/transaction-dialog'
import { StatementUploader } from '@/components/statement-uploader'
import { getDashboardMetrics } from '@/actions/dashboard'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const metrics = await getDashboardMetrics()

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-primary">FinanceHub</h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline-block">{user?.email}</span>
        </div>
      </header>
      <AccountSeeder />

      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <TransactionDialog defaultOpenOcr={true}>
            <Button className="h-24 flex-col gap-2 bg-primary/10 text-primary hover:bg-primary/20" variant="outline">
              <Camera className="h-6 w-6" />
              <span>Scan Invoice</span>
            </Button>
          </TransactionDialog>

          <StatementUploader>
            <Button className="h-24 flex-col gap-2 bg-primary/10 text-primary hover:bg-primary/20" variant="outline">
              <FileText className="h-6 w-6" />
              <span>Upload Statement</span>
            </Button>
          </StatementUploader>

          <Link href="/reports">
            <Button className="h-24 w-full flex-col gap-2 bg-primary/10 text-primary hover:bg-primary/20" variant="outline">
              <FileText className="h-6 w-6" />
              <span>View Reports</span>
            </Button>
          </Link>

          <TransactionDialog>
            <Button className="h-24 flex-col gap-2" variant="outline">
              <PlusCircle className="h-6 w-6" />
              <span>New Transaction</span>
            </Button>
          </TransactionDialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-success"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {currencyFormatter.format(metrics.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                Lifetime
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-destructive"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {currencyFormatter.format(metrics.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                Lifetime
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-primary"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currencyFormatter.format(metrics.netProfit)}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
