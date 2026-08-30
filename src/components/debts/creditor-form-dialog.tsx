'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createAccount } from '@/actions/accounts'
import { createCreditor, updateCreditor, type CreditorInput } from '@/actions/debts'
import type { Creditor, DebtType } from '@/types/debts'

interface CreditorFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Pass an existing creditor to edit it; omit to create a new one. */
    creditor?: Creditor
}

const DEBT_TYPE_LABELS: Record<DebtType, string> = {
    credit_card: 'Credit Card',
    loan: 'Loan',
    medical: 'Medical',
    other: 'Other',
}

export function CreditorFormDialog({ open, onOpenChange, creditor }: CreditorFormDialogProps) {
    const router = useRouter()
    const isEditing = !!creditor
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const [name, setName] = React.useState(creditor?.name ?? '')
    const [creditorOrg, setCreditorOrg] = React.useState(creditor?.creditorOrg ?? '')
    const [debtType, setDebtType] = React.useState<DebtType>(creditor?.debtType ?? 'credit_card')
    const [apr, setApr] = React.useState(creditor ? String(creditor.apr) : '')
    const [openingBalance, setOpeningBalance] = React.useState(creditor ? String(creditor.openingBalance) : '')
    const [openingDate, setOpeningDate] = React.useState(creditor?.openingDate ?? new Date().toISOString().slice(0, 10))
    const [minPayment, setMinPayment] = React.useState(creditor ? String(creditor.minPayment) : '')
    const [creditLimit, setCreditLimit] = React.useState(creditor?.creditLimit != null ? String(creditor.creditLimit) : '')
    const [dueDay, setDueDay] = React.useState(creditor?.dueDay != null ? String(creditor.dueDay) : '')
    const [notes, setNotes] = React.useState(creditor?.notes ?? '')

    React.useEffect(() => {
        if (!open) return
        setName(creditor?.name ?? '')
        setCreditorOrg(creditor?.creditorOrg ?? '')
        setDebtType(creditor?.debtType ?? 'credit_card')
        setApr(creditor ? String(creditor.apr) : '')
        setOpeningBalance(creditor ? String(creditor.openingBalance) : '')
        setOpeningDate(creditor?.openingDate ?? new Date().toISOString().slice(0, 10))
        setMinPayment(creditor ? String(creditor.minPayment) : '')
        setCreditLimit(creditor?.creditLimit != null ? String(creditor.creditLimit) : '')
        setDueDay(creditor?.dueDay != null ? String(creditor.dueDay) : '')
        setNotes(creditor?.notes ?? '')
        setError(null)
    }, [open, creditor])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return
        setIsSubmitting(true)
        setError(null)

        try {
            const input: Partial<CreditorInput> = {
                name,
                creditorOrg: creditorOrg || undefined,
                debtType,
                apr: apr ? Number(apr) : 0,
                minPayment: minPayment ? Number(minPayment) : 0,
                creditLimit: creditLimit ? Number(creditLimit) : undefined,
                dueDay: dueDay ? Number(dueDay) : undefined,
                notes: notes || undefined,
            }

            if (isEditing) {
                const result = await updateCreditor(creditor.id, input)
                if (!result.success) throw new Error(result.error)
            } else {
                // Every creditor is a metadata layer on top of a LIABILITY account
                // (see docs/CONSOLIDATION_ANALYSIS.md section 2) — create one with a
                // matching name rather than asking the user to manage accounts
                // separately for the common case of adding a new debt.
                const accountResult = await createAccount(name, 'LIABILITY')
                if ('error' in accountResult) throw new Error(accountResult.error)

                const result = await createCreditor({
                    ...(input as CreditorInput),
                    accountId: accountResult.data.id,
                    openingBalance: openingBalance ? Number(openingBalance) : 0,
                    openingDate,
                })
                if (!result.success) throw new Error(result.error)
            }

            onOpenChange(false)
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Debt' : 'Add a Debt'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update this creditor\'s details.'
                            : 'Track a credit card, loan, or other debt and see it factored into your payoff plan.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="creditor-name">Name</Label>
                            <Input id="creditor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chase Sapphire" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="creditor-type">Type</Label>
                            <Select value={debtType} onValueChange={(v) => setDebtType(v as DebtType)}>
                                <SelectTrigger id="creditor-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(DEBT_TYPE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="creditor-org">Creditor (optional)</Label>
                            <Input id="creditor-org" value={creditorOrg} onChange={(e) => setCreditorOrg(e.target.value)} placeholder="e.g. Chase" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="creditor-apr">APR %</Label>
                            <Input id="creditor-apr" type="number" step="0.01" value={apr} onChange={(e) => setApr(e.target.value)} placeholder="24.99" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="creditor-min-payment">Min. Monthly Payment</Label>
                            <Input id="creditor-min-payment" type="number" step="0.01" value={minPayment} onChange={(e) => setMinPayment(e.target.value)} placeholder="35.00" required />
                        </div>

                        {!isEditing && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="creditor-opening-balance">Current Balance</Label>
                                    <Input id="creditor-opening-balance" type="number" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="2500.00" required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="creditor-opening-date">As of</Label>
                                    <Input id="creditor-opening-date" type="date" value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} required />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="creditor-limit">Credit Limit (optional)</Label>
                            <Input id="creditor-limit" type="number" step="0.01" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="5000.00" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="creditor-due-day">Due Day (optional)</Label>
                            <Input id="creditor-due-day" type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="15" />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="creditor-notes">Notes (optional)</Label>
                            <Textarea id="creditor-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Debt'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
