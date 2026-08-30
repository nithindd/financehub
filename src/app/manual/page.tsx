import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, FileText, BarChart3, Settings, Info, CheckCircle2, ArrowLeft } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ManualPage() {
    return (
        <DashboardShell>
            <div className="flex flex-col gap-6">
                {/* Page Header with Back Button */}
                <div className="flex items-center gap-4">
                    <Link href="/profile">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">User Manual</h1>
                        <p className="text-muted-foreground">Guide to using FinanceHub features.</p>
                    </div>
                </div>

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
                                Stop typing in receipts. Our auto-enhanced camera captures and extracts data immediately.
                            </p>
                            <div className="grid gap-3">
                                <section className="flex items-start gap-3 rounded-lg border p-3">
                                    <div className="mt-0.5 rounded-full bg-blue-50 p-1 text-blue-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">How to use (Mobile):</h4>
                                        <p className="text-xs text-muted-foreground">Tap the central <strong>(+)</strong> button and select <strong>"Scan Invoice"</strong>. This launches your camera directly.</p>
                                    </div>
                                </section>
                                <section className="flex items-start gap-3 rounded-lg border p-3">
                                    <div className="mt-0.5 rounded-full bg-orange-50 p-1 text-orange-600">
                                        <Info className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Duplicate Detection:</h4>
                                        <p className="text-xs text-muted-foreground">The system checks for existing transactions with the same date/amount/vendor as you scan. A blue warning banner will appear if potential duplicates are found.</p>
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
                                Bulk import transaction history from your bank (CSV) or credit card statements (PDF).
                            </p>
                            <div className="grid gap-3">
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <h4 className="mb-2 text-sm font-semibold">Features:</h4>
                                    <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                                        <li><strong>Batch Duplicate Check:</strong> We analyze every row *before* import and warn you if we find matches in your history.</li>
                                        <li><strong>AI PDF Parsing:</strong> Upload a PDF bank statement to auto-extract table data.</li>
                                        <li><strong>Evidence Linking:</strong> The original file is stored securely and linked to the batch.</li>
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
            </div>
        </DashboardShell>
    )
}
