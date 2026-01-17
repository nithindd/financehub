import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, FileText, BarChart3, Settings, Info, CheckCircle2 } from 'lucide-react'

export default async function ManualPage() {
    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <Header title="User Manual" showBack={true} backHref="/profile" />

            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-12">
                <div className="mx-auto grid w-full max-w-4xl gap-6">

                    {/* Introduction */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-primary" />
                                Welcome to FinanceHub
                            </CardTitle>
                            <CardDescription>
                                Your intelligent assistant for professional double-entry accounting and expense tracking.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm leading-relaxed">
                            FinanceHub simplifies your accounting by combining AI-powered data entry with robust financial reporting.
                            This manual will help you get the most out of our "Smart-First" approach to money management.
                        </CardContent>
                    </Card>

                    {/* OCR Scanning */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="h-5 w-5 text-blue-500" />
                                Smart Invoice Scanning
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm">
                                Stop typing in receipts. Our Gemini-powered OCR (Optical Character Recognition) extracts data automatically.
                            </p>
                            <div className="grid gap-3">
                                <section className="flex items-start gap-3 rounded-lg border p-3">
                                    <div className="mt-0.5 rounded-full bg-blue-50 p-1 text-blue-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">How to use:</h4>
                                        <p className="text-xs text-muted-foreground">Click "Scan Invoice" on the dashboard. Upload a photo or PDF of your receipt. FinanceHub will identify the vendor, amount, date, and tax automatically.</p>
                                    </div>
                                </section>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statement Uploader */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-green-500" />
                                Bank Statements & Bulk Import
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm">
                                Bulk import transaction history from your bank or credit card statements.
                            </p>
                            <div className="grid gap-3">
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <h4 className="mb-2 text-sm font-semibold">Statement Features:</h4>
                                    <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                                        <li>Supports CSV uploads</li>
                                        <li>Custom column mapping (Date, Payee, Amount)</li>
                                        <li>Automatic duplicate detection</li>
                                        <li>Background vendor matching</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reports */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-purple-500" />
                                Financial Reporting
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm">
                                View real-time reports of your income and expenses.
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Analysis</h4>
                                    <p className="text-xs">Filter by any date range to see net profit and expense breakdowns across all your categories.</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Export & Share</h4>
                                    <p className="text-xs">Download professional PDF reports or CSV spreadsheets. You can also email reports directly from the platform.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-orange-500" />
                                Customization & Automation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm">
                                Fine-tune how FinanceHub works for you in the Profile settings.
                            </p>
                            <div className="grid gap-3 text-xs">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-semibold">Categories</span>
                                    <span className="text-muted-foreground">Customize your chart of accounts for better categorization.</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-semibold">Vendor Mappings</span>
                                    <span className="text-muted-foreground">Automate payees to specific expense categories.</span>
                                </div>
                                <div className="flex justify-between pb-2">
                                    <span className="font-semibold">Timezones</span>
                                    <span className="text-muted-foreground">Ensure your transaction dates match your local time.</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
    )
}
