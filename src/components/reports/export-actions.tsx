'use client'

import { Button } from "@/components/ui/button"
import { Download, Mail } from "lucide-react"
import { jsPDF } from "jspdf"
import Papa from "papaparse"
import { ReportTransaction } from "@/actions/reports"

interface ExportActionsProps {
    data: ReportTransaction[]
    startDate: Date
    endDate: Date
    onEmailClick: () => void
}

export function ExportActions({ data, startDate, endDate, onEmailClick }: ExportActionsProps) {
    const handleDownloadCSV = () => {
        const csv = Papa.unparse(data.map(t => ({
            Date: new Date(t.date).toLocaleDateString(),
            Description: t.description,
            Category: t.category,
            Type: t.type,
            Amount: t.amount.toFixed(2)
        })))

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
        doc.text("Category", 100, y)
        doc.text("Amount", 160, y)

        y += 5
        doc.line(14, y, 190, y)
        y += 5

        data.forEach((t) => {
            if (y > 280) {
                doc.addPage()
                y = 20
            }
            doc.text(new Date(t.date).toLocaleDateString(), 14, y)
            const desc = t.description.length > 30 ? t.description.substring(0, 27) + "..." : t.description
            doc.text(desc, 40, y)
            doc.text(t.category, 100, y)
            doc.text(`$${t.amount.toFixed(2)}`, 160, y)
            y += 7
        })

        doc.save(`financial_report_${startDate.toISOString().split('T')[0]}.pdf`)
    }

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button variant="default" size="sm" onClick={onEmailClick}>
                <Mail className="mr-2 h-4 w-4" /> Email Report
            </Button>
        </div>
    )
}
