'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Download, Mail } from "lucide-react"
import { jsPDF } from "jspdf"
import Papa from "papaparse"
import { ReportTransaction } from "@/actions/reports"
import { EmailReportDialog } from "./email-report-dialog"

interface ExportActionsProps {
    data: ReportTransaction[]
    summary: any
    startDate: Date
    endDate: Date
    defaultEmail?: string
}

export function ExportActions({ data, summary, startDate, endDate, defaultEmail }: ExportActionsProps) {
    const handleDownloadCSV = () => {
        // Expand each transaction into its journal entries
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

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('url')
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.setAttribute('href', url)
        a.setAttribute('download', `financial_report_${startDate.toISOString().split('T')[0]}.csv`)
        a.style.visibility = 'hidden'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    const handleDownloadPDF = () => {
        const doc = new jsPDF()

        doc.setFontSize(18)
        doc.text("Financial Report", 14, 22)

        doc.setFontSize(11)
        doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 14, 30)

        // Simple table simulation
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

                // Only show date and description for the first entry of a transaction
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
            y += 2 // Extra space between transactions
        })

        doc.save(`financial_report_${startDate.toISOString().split('T')[0]}.pdf`)
    }

    const [emailDialogOpen, setEmailDialogOpen] = React.useState(false)

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button variant="default" size="sm" onClick={() => setEmailDialogOpen(true)}>
                <Mail className="mr-2 h-4 w-4" /> Email Report
            </Button>

            <EmailReportDialog
                open={emailDialogOpen}
                onOpenChange={setEmailDialogOpen}
                data={data}
                summary={undefined} // passed down or calculated? It's not in props currently. will fix 
                startDate={startDate}
                endDate={endDate}
                defaultEmail={undefined} // Need to pass this in props
            />
        </div>
    )
}
