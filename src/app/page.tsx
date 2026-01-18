import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, FileText, Camera, BarChart3, Settings, Info, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react'
import { AccountSeeder } from '@/components/account-seeder'
import { TransactionDialog } from '@/components/transaction-dialog'
import { StatementUploader } from '@/components/statement-uploader'
import { getDashboardMetrics } from '@/actions/dashboard'
import { Header } from '@/components/layout/header'
import Link from 'next/link'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const metrics = await getDashboardMetrics()

    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    })

    return (
      <div className="flex min-h-screen flex-col bg-muted/20">
        <Header title="FinanceHub" />
        <AccountSeeder />

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <TransactionDialog defaultOpenOcr={true}>
              <Button className="h-24 flex-col gap-2 bg-primary/10 text-primary hover:bg-primary/20 md:hidden" variant="outline">
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
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-16 pb-32">
          <div className="container mx-auto px-4 text-center sm:px-8">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-primary mb-6">
              Professional Accounting,<br className="hidden sm:inline" /> Simplified by AI.
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10">
              Stop manually typing receipts. FinanceHub uses advanced AI to extract line items, categorize expenses, and generate professional financial reports in seconds.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/login">
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
              Join thousands of users who have switched to FinanceHub for smarter, faster accounting.
            </p>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-semibold">
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 bg-muted/20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} FinanceHub. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
