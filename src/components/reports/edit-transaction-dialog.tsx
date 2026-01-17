'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTransactionById, updateTransaction } from '@/actions/transactions'
import { getAccounts, type Account } from '@/actions/accounts'
import { DatePicker } from '@/components/ui/date-picker'
import { Loader2, Plus, X, Paperclip } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EditTransactionDialogProps {
    transactionId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditTransactionDialog({ transactionId, open, onOpenChange }: EditTransactionDialogProps) {
    const router = useRouter()
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [accounts, setAccounts] = React.useState<Account[]>([])

    const [date, setDate] = React.useState<Date>(new Date())
    const [description, setDescription] = React.useState('')
    const [evidencePath, setEvidencePath] = React.useState<string | null>(null)
    const [entries, setEntries] = React.useState<Array<{
        accountId: string
        type: 'DEBIT' | 'CREDIT'
        amount: string
    }>>([])

    // Load transaction data and accounts
    React.useEffect(() => {
        if (open) {
            loadData()
        }
    }, [open, transactionId])

    const loadData = async () => {
        setLoading(true)
        const [txData, accountsData] = await Promise.all([
            getTransactionById(transactionId),
            getAccounts()
        ])

        if (txData) {
            setDate(new Date(txData.date))
            setDescription(txData.description)
            setEvidencePath(txData.evidence_path)
            setEntries(txData.journal_entries.map((e: any) => ({
                accountId: e.account_id,
                type: e.entry_type,
                amount: e.amount.toString()
            })))
        }
        setAccounts(accountsData)
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate entries
        const totalDebits = entries.filter(e => e.type === 'DEBIT').reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0)
        const totalCredits = entries.filter(e => e.type === 'CREDIT').reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0)

        if (Math.abs(totalDebits - totalCredits) > 0.01) {
            alert(`Transaction not balanced! Debits: $${totalDebits.toFixed(2)}, Credits: $${totalCredits.toFixed(2)}`)
            return
        }

        setSaving(true)
        const result = await updateTransaction(transactionId, {
            date,
            description,
            entries: entries.map(e => ({
                accountId: e.accountId,
                type: e.type,
                amount: parseFloat(e.amount)
            })),
            evidencePath: evidencePath || undefined
        })
        setSaving(false)

        if (result.error) {
            alert('Failed to update: ' + result.error)
        } else {
            onOpenChange(false)
            router.refresh()
        }
    }

    const addEntry = () => {
        setEntries([...entries, { accountId: '', type: 'DEBIT', amount: '' }])
    }

    const removeEntry = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index))
    }

    const updateEntry = (index: number, field: string, value: any) => {
        const newEntries = [...entries]
        newEntries[index] = { ...newEntries[index], [field]: value }
        setEntries(newEntries)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Transaction</DialogTitle>
                    <DialogDescription>Modify transaction details and entries</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="sm:text-right">Date</Label>
                            <div className="sm:col-span-3">
                                <DatePicker
                                    date={date}
                                    setDate={(d) => d && setDate(d)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="sm:text-right">Description</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="sm:col-span-3"
                                required
                            />
                        </div>

                        {evidencePath && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <div className="sm:text-right text-xs text-muted-foreground">Receipt</div>
                                <div className="sm:col-span-3">
                                    <Button variant="outline" size="sm" asChild className="gap-2">
                                        <a href={evidencePath} target="_blank" rel="noopener noreferrer">
                                            <Paperclip className="h-4 w-4" />
                                            View Linked File
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Journal Entries</Label>
                            {entries.map((entry, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-end">
                                    <div className="flex-1">
                                        <Select value={entry.accountId} onValueChange={(v) => updateEntry(index, 'accountId', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-full sm:w-24">
                                        <Select value={entry.type} onValueChange={(v) => updateEntry(index, 'type', v as 'DEBIT' | 'CREDIT')}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DEBIT">Debit</SelectItem>
                                                <SelectItem value="CREDIT">Credit</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-full sm:w-32">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={entry.amount}
                                            onChange={(e) => updateEntry(index, 'amount', e.target.value)}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeEntry(index)}
                                        disabled={entries.length <= 2}
                                        className="self-end sm:self-auto"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addEntry}>
                                <Plus className="h-4 w-4 mr-2" /> Add Entry
                            </Button>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
