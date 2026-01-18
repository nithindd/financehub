import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowRight, Camera, FileText, BarChart3, Settings, Info, CheckCircle2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getAccountBalances } from '@/actions/accounts'
import { getMonthlyFinancials } from '@/actions/analytics'
import { getFinancialReport } from '@/actions/reports'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { AccountCards } from '@/components/dashboard/account-cards'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { NetWorthChart } from '@/components/analytics/net-worth-chart'
import { EmptyDashboardState } from '@/components/dashboard/empty-state'

import { getUserPreferences } from '@/actions/profile'
// ...

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // 1. Fetch Account Balances & Preferences
    const [accountBalances, preferences] = await Promise.all([
      getAccountBalances(),
      getUserPreferences()
    ])

    const { currency, locale } = preferences as any // Type assertion if needed or fix types

    // 2. Fetch Monthly Financials for Chart (Last 6 months)
    const today = new Date()
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)
    const monthlyData = await getMonthlyFinancials(sixMonthsAgo, today)

    // 3. Fetch Recent Transactions
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30))
    const reportData = await getFinancialReport(thirtyDaysAgo, new Date())
    const recentTransactions = 'error' in reportData ? [] : reportData.transactions.slice(0, 5)

    return (
      <DashboardShell>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}</h1>
              <p className="text-muted-foreground">Here&apos;s your financial overview.</p>
            </div>
          </div>

          {accountBalances.every(acc => acc.balance === 0) && recentTransactions.length === 0 ? (
            <EmptyDashboardState userName={user.user_metadata?.full_name?.split(' ')[0] || 'User'} />
          ) : (
            <>
              <AccountCards
                accounts={accountBalances}
                currency={currency || 'USD'}
                locale={locale || 'en-US'}
              />

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 lg:col-span-5">
                  <NetWorthChart data={monthlyData} />
                </div>
                <div className="col-span-4 lg:col-span-2">
                  <RecentTransactions
                    transactions={recentTransactions}
                    currency={currency || 'USD'}
                    locale={locale || 'en-US'}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardShell>
    )
  }

  // Landing Page for Non-Authenticated Users
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span>FinanceHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Educational Warning */}
      <div className="bg-amber-100 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3 text-center text-sm text-amber-900 dark:text-amber-200">
        <p>
          <strong>Note:</strong> This website was created purely for my educational purpose. Please refrain from using it for any professional use other than for feature exploration.
        </p>
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-16 pb-32">
          <div className="container mx-auto px-4 text-center sm:px-8">
            <h2 className="text-3xl font-bold tracking-tight mb-6">Ready to take control of your finances?</h2>
            <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80 mb-10">
              Switch to FinanceHub today for smarter, faster accounting.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-lg gap-2">
                  Start for Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to manage your money</h2>
              <p className="text-muted-foreground">Powerful features designed for freelancers, contractors, and small business owners.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-t-4 border-t-blue-500 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Camera className="h-6 w-6 text-blue-500" />
                    Smart OCR Scanning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Upload photos or PDFs of invoices. Our AI extracts line items, taxes, and vendor details automatically with 99% accuracy.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-green-500 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="h-6 w-6 text-green-500" />
                    Bulk Statement Import
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Import CSV statements from your bank. Map columns easily and detect duplicate transactions instantly.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-purple-500 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChart3 className="h-6 w-6 text-purple-500" />
                    Interactive Reporting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Track income, expenses, and net profit in real-time. Visualize spending by category and identify financial trends.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-orange-500 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Settings className="h-6 w-6 text-orange-500" />
                    Smart Customization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Define your own chart of accounts. Set up rules to automatically categorize repeat vendors and transactions.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-pink-500 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Info className="h-6 w-6 text-pink-500" />
                    Detailed Auditing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Keep track of every penny. Evidence attachments link directly to transactions for bulletproof auditing.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-teal-500 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CheckCircle2 className="h-6 w-6 text-teal-500" />
                    Tax Ready
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Exports clean data for tax season. Separate sales tax and tips automatically for accurate deductions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center sm:px-8">
            <h2 className="text-3xl font-bold tracking-tight mb-6">Ready to take control of your finances?</h2>
            <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80 mb-10">
              Switch to FinanceHub today for smarter, faster accounting.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-semibold">
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
