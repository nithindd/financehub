'use client'

import { ReportTransaction } from "@/actions/reports"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Paperclip, Layers } from "lucide-react"
import { deleteTransaction } from "@/actions/transactions"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { useRouter } from "next/navigation"
import * as React from "react"
import { cn } from "@/lib/utils"

interface TransactionTableProps {
    transactions: ReportTransaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
    const router = useRouter()
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [expandedId, setExpandedId] = React.useState<string | null>(null)

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
                            <th className="h-12 w-10 px-4"></th>
                            <th className="h-12 px-4 font-medium text-muted-foreground">Date</th>
                            <th className="h-12 px-4 font-medium text-muted-foreground">Description</th>
                            <th className="h-12 px-4 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                            <th className="h-12 px-4 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                            <th className="h-12 px-4 font-medium text-muted-foreground text-right">Amount</th>
                            <th className="h-12 px-4 font-medium text-muted-foreground text-center">Receipt</th>
                            <th className="h-12 px-4 font-medium text-muted-foreground text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {transactions.map((tx) => (
                            <React.Fragment key={tx.id}>
                                <tr
                                    className={cn(
                                        "border-b transition-colors hover:bg-muted/50 cursor-pointer",
                                        expandedId === tx.id && "bg-muted/30"
                                    )}
                                    onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                                >
                                    <td className="p-4 align-middle italic text-xs text-muted-foreground">
                                        {expandedId === tx.id ? '▼' : '▶'}
                                    </td>
                                    <td className="p-4 align-middle">
                                        {new Date(tx.date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 align-middle font-medium">
                                        <div className="flex items-center gap-2">
                                            {tx.description}
                                            {tx.parentId && (
                                                <Layers className="h-3 w-3 text-muted-foreground/50" />
                                            )}
                                        </div>
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
                                    <td className="p-4 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                                        {tx.evidencePath ? (
                                            <a href={tx.evidencePath} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80" title="View Evidence">
                                                <Paperclip className="h-4 w-4 mx-auto" />
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground/30 text-xs">None</span>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
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
                                {expandedId === tx.id && (
                                    <tr className="bg-muted/10">
                                        <td colSpan={8} className="p-0">
                                            <div className="px-12 py-4 border-b">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Journal Entry Details (Splits)</h4>
                                                <div className="grid grid-cols-3 gap-4 text-sm max-w-2xl">
                                                    <div className="font-medium">Account</div>
                                                    <div className="text-center font-medium">Type</div>
                                                    <div className="text-right font-medium">Amount</div>
                                                    {tx.journalEntries.map((entry, i) => (
                                                        <React.Fragment key={i}>
                                                            <div className="text-muted-foreground">{entry.accountName} <span className="text-[10px] text-muted-foreground/50">({entry.accountType})</span></div>
                                                            <div className="text-center">
                                                                <Badge variant="outline" className="text-[10px] h-4">
                                                                    {entry.type}
                                                                </Badge>
                                                            </div>
                                                            <div className={cn("text-right font-mono", entry.type === 'CREDIT' ? "text-muted-foreground" : "text-primary")}>
                                                                {entry.type === 'CREDIT' ? `(${currencyFormatter.format(entry.amount)})` : currencyFormatter.format(entry.amount)}
                                                            </div>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
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
