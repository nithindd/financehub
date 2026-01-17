'use client'

import { ReportTransaction } from "@/actions/reports"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { deleteTransaction } from "@/actions/transactions"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { useRouter } from "next/navigation"
import * as React from "react"

interface TransactionTableProps {
    transactions: ReportTransaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
    const router = useRouter()
    const [editingId, setEditingId] = React.useState<string | null>(null)

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    })

    const handleDelete = async (id: string, description: string) => {
        if (!confirm(`Delete transaction: "${description}"?`)) return

        const result = await deleteTransaction(id)
        if (result.error) {
            alert('Failed to delete: ' + result.error)
        } else {
            router.refresh()
        }
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/10">
                No transactions found for this period.
            </div>
        )
    }

    return (
        <>
            <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                        <tr className="text-left">
                            <th className="h-12 px-4 font-medium text-muted-foreground">Date</th>
                            <th className="h-12 px-4 font-medium text-muted-foreground">Description</th>
                            <th className="h-12 px-4 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                            <th className="h-12 px-4 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                            <th className="h-12 px-4 font-medium text-muted-foreground text-right">Amount</th>
                            <th className="h-12 px-4 font-medium text-muted-foreground text-right">Actions</th>
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
                                </td>
                                <td className="p-4 align-middle hidden md:table-cell">
                                    <span className="text-muted-foreground">{tx.category}</span>
                                </td>
                                <td className="p-4 align-middle hidden md:table-cell">
                                    <Badge variant={tx.type === 'INCOME' ? 'default' : tx.type === 'EXPENSE' ? 'destructive' : 'secondary'}>
                                        {tx.type}
                                    </Badge>
                                </td>
                                <td className="p-4 align-middle text-right font-mono">
                                    {currencyFormatter.format(tx.amount)}
                                </td>
                                <td className="p-4 align-middle text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setEditingId(tx.id)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(tx.id, tx.description)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingId && (
                <EditTransactionDialog
                    transactionId={editingId}
                    open={!!editingId}
                    onOpenChange={(open) => !open && setEditingId(null)}
                />
            )}
        </>
    )
}
