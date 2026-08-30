'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { deleteCreditor } from '@/actions/debts'
import { CreditorFormDialog } from './creditor-form-dialog'
import type { Creditor, CreditorProjection } from '@/types/debts'

interface CreditorTableProps {
    creditors: Creditor[]
    projections: CreditorProjection[]
    /** The signed-in user's own id — rows owned by someone else (shared household view) are read-only. */
    currentUserId: string
    currency?: string
    locale?: string
}

const DEBT_TYPE_LABELS: Record<string, string> = {
    credit_card: 'Credit Card',
    loan: 'Loan',
    medical: 'Medical',
    other: 'Other',
}

export function CreditorTable({ creditors, projections, currentUserId, currency = 'USD', locale = 'en-US' }: CreditorTableProps) {
    const router = useRouter()
    const fmt = new Intl.NumberFormat(locale, { style: 'currency', currency })
    const [editing, setEditing] = React.useState<Creditor | null>(null)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)

    const balanceFor = (creditorId: string) => projections.find((p) => p.creditorId === creditorId)?.startingBalance ?? 0

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this debt? This does not delete its transaction history.')) return
        setDeletingId(id)
        const result = await deleteCreditor(id)
        setDeletingId(null)
        if (result.success) router.refresh()
        else alert(result.error)
    }

    if (creditors.length === 0) {
        return <p className="text-sm text-muted-foreground py-8 text-center">No debts tracked yet. Add one to see it factored into your payoff plan.</p>
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">APR</TableHead>
                        <TableHead className="text-right">Min. Payment</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {creditors.map((creditor) => {
                        const isOwnRow = creditor.userId === currentUserId
                        return (
                            <TableRow key={creditor.id}>
                                <TableCell className="font-medium">
                                    {creditor.name}
                                    {creditor.creditorOrg && <span className="text-muted-foreground font-normal"> · {creditor.creditorOrg}</span>}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{DEBT_TYPE_LABELS[creditor.debtType] ?? creditor.debtType}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{fmt.format(balanceFor(creditor.id))}</TableCell>
                                <TableCell className="text-right">{creditor.apr.toFixed(2)}%</TableCell>
                                <TableCell className="text-right">{fmt.format(creditor.minPayment)}</TableCell>
                                <TableCell>
                                    {isOwnRow ? (
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(creditor)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                disabled={deletingId === creditor.id}
                                                onClick={() => handleDelete(creditor.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Shared</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {editing && (
                <CreditorFormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} creditor={editing} />
            )}
        </>
    )
}
