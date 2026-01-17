'use client'

import { ReportTransaction } from "@/actions/reports"
import { Badge } from "@/components/ui/badge"

interface TransactionTableProps {
    transactions: ReportTransaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    })

    if (transactions.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/10">
                No transactions found for this period.
            </div>
        )
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                    <tr className="text-left">
                        <th className="h-12 px-4 font-medium text-muted-foreground">Date</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground center">Description</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">
                                {new Date(tx.date).toLocaleDateString()}
                            </td>
                            <td className="p-4 align-middle font-medium">
                                {tx.description}
                                {tx.evidencePath && (
                                    <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                                        Has Receipt
                                    </span>
                                )}
                            </td>
                            <td className="p-4 align-middle hidden md:table-cell">
                                <Badge variant="outline">{tx.category}</Badge>
                            </td>
                            <td className="p-4 align-middle hidden md:table-cell">
                                <Badge
                                    className={
                                        tx.type === 'INCOME' ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100" :
                                            tx.type === 'EXPENSE' ? "bg-red-100 text-red-800 border-red-200 hover:bg-red-100" :
                                                "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100"
                                    }
                                    variant="secondary"
                                >
                                    {tx.type}
                                </Badge>
                            </td>
                            <td className="p-4 align-middle text-right font-medium">
                                <span className={
                                    tx.type === 'INCOME' ? "text-green-600" :
                                        tx.type === 'EXPENSE' ? "text-red-600" :
                                            ""
                                }>
                                    {tx.type === 'EXPENSE' ? "-" : "+"}{currencyFormatter.format(tx.amount)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
