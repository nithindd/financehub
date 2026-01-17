'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Loader2, Upload } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getAccounts, type Account } from '@/actions/accounts'
import { createTransaction } from '@/actions/transactions'
import { processInvoice } from '@/actions/ocr'
import { cn } from '@/lib/utils'

interface JournalEntryRow {
    accountId: string
    type: 'DEBIT' | 'CREDIT'
    amount: string
}

export function TransactionDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [description, setDescription] = useState('')
    const [rows, setRows] = useState<JournalEntryRow[]>([
        { accountId: '', type: 'DEBIT', amount: '' },
        { accountId: '', type: 'CREDIT', amount: '' }
    ])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(false)
    const [ocrLoading, setOcrLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Fetch accounts on open
    useEffect(() => {
        if (open) {
            getAccounts().then(setAccounts)
        }
    }, [open])

    const addRow = () => {
        setRows([...rows, { accountId: '', type: 'DEBIT', amount: '' }])
    }

    const removeRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index))
    }

    const updateRow = (index: number, field: keyof JournalEntryRow, value: string) => {
        const newRows = [...rows]
        newRows[index] = { ...newRows[index], [field]: value }
        setRows(newRows)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        console.log("Client: File selected, starting upload...", file.name, file.size)

        // Reset input so same file can be selected again
        e.target.value = ''

        setOcrLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const result = await processInvoice(formData)
            console.log("Client: OCR Result received", result)
            setOcrLoading(false)

            if (result.error) {
                console.error('OCR Error:', result.error)
                alert(`OCR Failed: ${result.error}`)
                return
            }

            if (result.data) {
                const { date: dateStr, description: desc, totalAmount } = result.data

                if (dateStr) {
                    const parsedDate = new Date(dateStr)
                    if (!isNaN(parsedDate.getTime())) {
                        setDate(parsedDate)
                    }
                }
                if (desc) setDescription(desc)

                // Auto-fill rows if total found
                if (totalAmount && accounts.length > 0) {
                    const amountValue = typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount
                    if (isNaN(amountValue)) return

                    const amountStr = amountValue.toFixed(2)

                    // Find potential accounts
                    const expenseAcc = accounts.find(a => a.type === 'EXPENSE')
                    const assetAcc = accounts.find(a => a.type === 'ASSET' || a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank'))

                    const newRows: JournalEntryRow[] = []
                    if (expenseAcc) {
                        newRows.push({ accountId: expenseAcc.id, type: 'DEBIT', amount: amountStr })
                    }
                    if (assetAcc) {
                        newRows.push({ accountId: assetAcc.id, type: 'CREDIT', amount: amountStr })
                    }

                    if (newRows.length === 2) {
                        setRows(newRows)
                    } else if (newRows.length > 0) {
                        // Just append or replace the first two if we only found one
                        const updatedRows = [...rows]
                        if (expenseAcc) {
                            updatedRows[0] = { accountId: expenseAcc.id, type: 'DEBIT', amount: amountStr }
                        }
                        if (assetAcc) {
                            updatedRows[1] = { accountId: assetAcc.id, type: 'CREDIT', amount: amountStr }
                        }
                        setRows(updatedRows)
                    }
                }
            }
        } catch (err) {
            console.error("Client: processInvoice Exception", err)
            alert("Failed to process invoice. Check console.")
            setOcrLoading(false)
        }
    }


    const totalDebits = rows
        .filter(r => r.type === 'DEBIT')
        .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)

    const totalCredits = rows
        .filter(r => r.type === 'CREDIT')
        .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)

    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01
    const isValid = description && date && rows.every(r => r.accountId && r.amount) && isBalanced

    const handleSubmit = async () => {
        if (!isValid || !date) return

        setLoading(true)
        const result = await createTransaction({
            date,
            description,
            entries: rows.map(r => ({
                accountId: r.accountId,
                type: r.type,
                amount: parseFloat(r.amount)
            }))
        })
        setLoading(false)

        if (result.error) {
            alert(result.error)
        } else {
            setOpen(false)
            // Reset form
            setDescription('')
            setDate(new Date())
            setRows([
                { accountId: '', type: 'DEBIT', amount: '' },
                { accountId: '', type: 'CREDIT', amount: '' }
            ])
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>New Transaction</DialogTitle>
                    <DialogDescription>
                        Enter a double-entry transaction. Ensure debits equal credits.
                    </DialogDescription>
                </DialogHeader>

                {/* OCR Button */}
                <div className="flex justify-center py-2 border-b border-dashed">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                        onClick={() => {
                            console.log("Client: Clicked Scan Invoice");
                            fileInputRef.current?.click();
                        }}
                        disabled={ocrLoading}
                    >
                        {ocrLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {ocrLoading ? "Scanning Invoice..." : "Auto-fill from Invoice Image"}
                    </Button>
                </div>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Date
                        </Label>
                        <div className="col-span-3">
                            <DatePicker date={date} setDate={setDate} />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Description
                        </Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="col-span-3"
                        />
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium">Entries</h4>
                            <div className={cn("text-sm font-bold", isBalanced ? "text-success" : "text-destructive")}>
                                {isBalanced ? "Balanced" : `Off by $${Math.abs(totalDebits - totalCredits).toFixed(2)}`}
                            </div>
                        </div>

                        {rows.map((row, index) => (
                            <div key={index} className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <Label className="text-xs">Account</Label>
                                    <Select value={row.accountId} onValueChange={(val) => updateRow(index, 'accountId', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.type})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-24">
                                    <Label className="text-xs">Type</Label>
                                    <Select value={row.type} onValueChange={(val: 'DEBIT' | 'CREDIT') => updateRow(index, 'type', val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DEBIT">Debit</SelectItem>
                                            <SelectItem value="CREDIT">Credit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-32">
                                    <Label className="text-xs">Amount</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={row.amount}
                                        onChange={(e) => updateRow(index, 'amount', e.target.value)}
                                    />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeRow(index)} disabled={rows.length <= 2}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        ))}

                        <Button variant="outline" size="sm" onClick={addRow} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Split
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={!isValid || loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Transaction
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
