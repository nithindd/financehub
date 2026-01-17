'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportSummary as ReportSummaryType } from "@/actions/reports"

interface ReportSummaryProps {
    summary: ReportSummaryType
}

export function ReportSummary({ summary }: ReportSummaryProps) {
    const format = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{format(summary.totalIncome)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{format(summary.totalExpenses)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {format(summary.netProfit)}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
