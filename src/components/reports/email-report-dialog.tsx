'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { sendReportEmail } from "@/actions/reports"
import { jsPDF } from "jspdf"
import Papa from "papaparse"
import { ReportTransaction } from "@/actions/reports"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface EmailReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: ReportTransaction[]
    summary: any
    startDate: Date
    endDate: Date
    defaultEmail: string | undefined
}

export function EmailReportDialog({
    open,
    onOpenChange,
    data,
    summary,
    startDate,
    endDate,
    defaultEmail
}: EmailReportDialogProps) {
    const [email, setEmail] = React.useState(defaultEmail || "")
    const [attachCsv, setAttachCsv] = React.useState(true)
    const [attachPdf, setAttachPdf] = React.useState(true)
    const [attachReceipts, setAttachReceipts] = React.useState(false)
    const [isSending, setIsSending] = React.useState(false)
    const [status, setStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null)

    React.useEffect(() => {
        if (!open) {
            setStatus(null)
        }
    }, [open])

    React.useEffect(() => {
        if (defaultEmail) {
            setEmail(defaultEmail)
        }
    }, [defaultEmail])

    // Generate CSV Blob
    const generateCsvUser = () => {
        const expandedData = data.flatMap(t =>
            t.journalEntries.map(e => ({
                Date: new Date(t.date).toLocaleDateString(),
                Transaction: t.description,
                Account: e.accountName,
                AccountType: e.accountType,
                EntryType: e.type,
                Amount: e.amount.toFixed(2)
            }))
        )
        const csv = Papa.unparse(expandedData)
        return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    }

    // Generate PDF Blob (Basic implementation matching ExportActions)
    const generatePdfUser = () => {
        const doc = new jsPDF()
        doc.setFontSize(18)
        doc.text("Financial Report", 14, 22)
        doc.setFontSize(11)
        doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 14, 30)
        let y = 40
        doc.setFontSize(10)
        doc.text("Date", 14, y)
        doc.text("Description", 40, y)
        doc.text("Account", 100, y)
        doc.text("Amount", 160, y)
        y += 5
        doc.line(14, y, 190, y)
        y += 5

        data.forEach((t) => {
            t.journalEntries.forEach((e, index) => {
                if (y > 280) {
                    doc.addPage()
                    y = 20
                }

                if (index === 0) {
                    doc.setFont("helvetica", "bold")
                    doc.text(new Date(t.date).toLocaleDateString(), 14, y)
                    const desc = t.description.length > 30 ? t.description.substring(0, 27) + "..." : t.description
                    doc.text(desc, 40, y)
                    doc.setFont("helvetica", "normal")
                }

                doc.text(e.accountName, 100, y)
                const amountText = e.type === 'CREDIT' ? `(${e.amount.toFixed(2)})` : e.amount.toFixed(2)
                doc.text(amountText, 160, y, { align: 'right' })
                y += 7
            })
            y += 2
        })
        return doc.output('blob')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSending(true)

        try {
            const formData = new FormData()
            formData.append('email', email)
            formData.append('summary', JSON.stringify(summary))
            formData.append('period', `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`)
            formData.append('includeReceipts', attachReceipts.toString())

            if (attachCsv) {
                formData.append('files', generateCsvUser(), `report_${startDate.toISOString().split('T')[0]}.csv`)
            }
            if (attachPdf) {
                formData.append('files', generatePdfUser(), `report_${startDate.toISOString().split('T')[0]}.pdf`)
            }

            // If attachReceipts is true, we ideally tell server to fetch them from storage and attach
            // Or we check which transactions have 'evidencePath' and pass those paths
            if (attachReceipts) {
                const receiptPaths = data.filter(t => t.evidencePath).map(t => t.evidencePath)
                formData.append('receiptPaths', JSON.stringify(receiptPaths))
            }

            const result = await sendReportEmail(formData)
            if (result.success) {
                setStatus({ type: 'success', message: `Email sent to ${email}!` })
                setTimeout(() => onOpenChange(false), 2000)
            } else {
                setStatus({ type: 'error', message: result.error || 'Failed to send email' })
            }
        } catch (error) {
            console.error(error)
            setStatus({ type: 'error', message: 'An unexpected error occurred' })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Email Report</DialogTitle>
                    <DialogDescription>
                        Send this financial report to yourself or your accountant.
                    </DialogDescription>
                </DialogHeader>

                {status?.type === 'success' ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <CheckCircle className="h-16 w-16 text-green-500 animate-in zoom-in duration-300" />
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">Report Sent!</h3>
                            <p className="text-sm text-muted-foreground">{status.message}</p>
                        </div>
                        <Button onClick={() => onOpenChange(false)} variant="outline">Close Dialog</Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        {status && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{status.message}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Attachments</Label>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="csv" checked={attachCsv} onCheckedChange={(c) => setAttachCsv(!!c)} />
                                    <Label htmlFor="csv">Include CSV (Excel)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="pdf" checked={attachPdf} onCheckedChange={(c) => setAttachPdf(!!c)} />
                                    <Label htmlFor="pdf">Include PDF</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="receipts" checked={attachReceipts} onCheckedChange={(c) => setAttachReceipts(!!c)} />
                                    <Label htmlFor="receipts">Include Receipts (Images)</Label>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSending}>
                                {isSending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : "Send Email"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
