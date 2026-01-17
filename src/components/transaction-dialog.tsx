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
import { Plus, Trash2, Loader2, Upload, Check } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getAccounts, type Account } from '@/actions/accounts'
import { createTransaction, createTransactionBatch } from '@/actions/transactions'
import { processInvoice } from '@/actions/ocr'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'

interface JournalEntryRow {
    accountId: string
    type: 'DEBIT' | 'CREDIT'
    amount: string
}

interface LineItem {
    description: string
    amount: number
    accountId: string
}

export function TransactionDialog({ children, defaultOpenOcr = false }: { children: React.ReactNode, defaultOpenOcr?: boolean }) {
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
    const [evidencePath, setEvidencePath] = useState<string | null>(null)
    const [lineItems, setLineItems] = useState<LineItem[]>([])
    const [bankAccountId, setBankAccountId] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Fetch accounts on open
    // Fetch accounts on open
    useEffect(() => {
        if (open) {
            getAccounts().then(setAccounts)
            if (defaultOpenOcr) {
                // Small timeout to ensure DOM is ready
                setTimeout(() => {
                    fileInputRef.current?.click()
                }, 100)
            }
        }
    }, [open, defaultOpenOcr])

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

        // 1. Upload to Supabase Storage
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            alert("Please log in to upload files.")
            setOcrLoading(false)
            return
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        console.log("Client: Uploading to Supabase Storage...", fileName)
        const { error: uploadError } = await supabase.storage
            .from('evidence')
            .upload(fileName, file)

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError)
            alert(`Failed to upload file to storage: ${uploadError.message}`)
            setOcrLoading(false)
            return
        }

        const publicUrl = supabase.storage.from('evidence').getPublicUrl(fileName).data.publicUrl
        setEvidencePath(publicUrl)

        // 2. Process with OCR
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
                const { date: dateStr, vendor, items, totalAmount, tax, tip } = result.data

                if (dateStr) {
                    // Manually parse YYYY-MM-DD to ensure local time is used (avoiding UTC offset issues)
                    const [y, m, d] = dateStr.split('-').map(Number)
                    if (y && m && d) {
                        const localDate = new Date(y, m - 1, d)
                        if (!isNaN(localDate.getTime())) {
                            setDate(localDate)
                        }
                    }
                }
                if (vendor) setDescription(vendor)

                // Find potential accounts
                const expenseAcc = accounts.find(a => a.type === 'EXPENSE')
                const assetAcc = accounts.find(a => a.type === 'ASSET' || a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank'))

                if (assetAcc) setBankAccountId(assetAcc.id)

                if (items && Array.isArray(items) && items.length > 0) {
                    const newItems = items.map((item: any) => ({
                        description: item.description,
                        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount,
                        accountId: expenseAcc?.id || ''
                    }))

                    // Add Tax if present
                    if (tax && typeof tax === 'number' && tax > 0) {
                        newItems.push({
                            description: "Tax",
                            amount: tax,
                            accountId: expenseAcc?.id || '' // User should probably categorize this specifically
                        })
                    }

                    // Add Tip if present
                    if (tip && typeof tip === 'number' && tip > 0) {
                        newItems.push({
                            description: "Tip",
                            amount: tip,
                            accountId: expenseAcc?.id || ''
                        })
                    }

                    setLineItems(newItems)
                    // Clear simple rows if we have line items
                    setRows([])
                } else if (totalAmount && accounts.length > 0) {
                    // Fallback to simple rows if no line items found
                    const amountValue = typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount
                    if (isNaN(amountValue)) return

                    const amountStr = amountValue.toFixed(2)

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
                        const updatedRows = [...rows]
                        if (expenseAcc) updatedRows[0] = { accountId: expenseAcc.id, type: 'DEBIT', amount: amountStr }
                        if (assetAcc) updatedRows[1] = { accountId: assetAcc.id, type: 'CREDIT', amount: amountStr }
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

    const isBalanced = rows.length > 0 ? Math.abs(totalDebits - totalCredits) < 0.01 : true
    const isLineItemsValid = lineItems.length > 0 && bankAccountId && lineItems.every(li => li.description && li.amount > 0 && li.accountId)
    const isValid = description && date && (
        (lineItems.length > 0 ? isLineItemsValid : (rows.every(r => r.accountId && r.amount) && isBalanced))
    )

    const handleSubmit = async () => {
        if (!isValid || !date) return

        setLoading(true)

        if (lineItems.length > 0) {
            // Batch mode: Every line item is a transaction
            const batch = lineItems.map((li, index) => ({
                date,
                description: `${description}: ${li.description}`,
                entries: [
                    { accountId: li.accountId, type: 'DEBIT' as const, amount: li.amount },
                    { accountId: bankAccountId, type: 'CREDIT' as const, amount: li.amount }
                ],
                // Only first transaction gets the evidence path
                evidencePath: index === 0 ? (evidencePath || undefined) : undefined
            }))

            const result = await createTransactionBatch(batch)
            if (!result.success) {
                alert(result.error)
            } else {
                setOpen(false)
                resetForm()
            }
        } else {
            // Single transaction mode
            const result = await createTransaction({
                date,
                description,
                entries: rows.map(r => ({
                    accountId: r.accountId,
                    type: r.type,
                    amount: parseFloat(r.amount)
                })),
                evidencePath: evidencePath || undefined
            })
            if (!result.success) {
                alert(result.error)
            } else {
                setOpen(false)
                resetForm()
            }
        }
        setLoading(false)
    }

    const resetForm = () => {
        setDescription('')
        setDate(new Date())
        setEvidencePath(null)
        setLineItems([])
        setBankAccountId('')
        setRows([
            { accountId: '', type: 'DEBIT', amount: '' },
            { accountId: '', type: 'CREDIT', amount: '' }
        ])
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
                        accept="image/*,application/pdf"
                        capture="environment"
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
                {evidencePath && (
                    <div className="flex items-center justify-center gap-2 py-1 text-xs text-success bg-success/5 border-b">
                        <Check className="h-3 w-3" />
                        File attached and will be linked to this transaction
                    </div>
                )}

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="sm:text-right">
                            Date
                        </Label>
                        <div className="sm:col-span-3">
                            <DatePicker date={date} setDate={setDate} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="sm:text-right">
                            Description
                        </Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="sm:col-span-3"
                        />
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        {lineItems.length > 0 ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Detected Line Items</h4>
                                    <Button variant="ghost" size="sm" onClick={() => setLineItems([])} className="h-8 text-xs">
                                        Switch to Simple Mode
                                    </Button>
                                </div>

                                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-md space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                        <Label className="sm:text-right text-xs font-semibold text-blue-700">Bank/Asset Account</Label>
                                        <div className="sm:col-span-3">
                                            <Select value={bankAccountId} onValueChange={setBankAccountId}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select Paid From Account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts.filter(a => a.type === 'ASSET' || a.name.toLowerCase().includes('bank')).map(acc => (
                                                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[10px] text-blue-600 mt-1">This account will be credited for all items below.</p>
                                        </div>
                                    </div>
                                </div>

                                {lineItems.map((item, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-end border-b pb-3 last:border-0">
                                        <div className="flex-[2]">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Item Description</Label>
                                            <Input
                                                value={item.description}
                                                onChange={(e) => {
                                                    const newItems = [...lineItems]
                                                    newItems[index].description = e.target.value
                                                    setLineItems(newItems)
                                                }}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="flex-[1]">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Category/Account</Label>
                                            <Select
                                                value={item.accountId}
                                                onValueChange={(val) => {
                                                    const newItems = [...lineItems]
                                                    newItems[index].accountId = val
                                                    setLineItems(newItems)
                                                }}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts.map(acc => (
                                                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Amount</Label>
                                            <Input
                                                type="number"
                                                value={item.amount}
                                                onChange={(e) => {
                                                    const newItems = [...lineItems]
                                                    newItems[index].amount = parseFloat(e.target.value) || 0
                                                    setLineItems(newItems)
                                                }}
                                                className="h-8 font-mono"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))}
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="text-right pt-2 border-t">
                                    <span className="text-sm font-semibold">
                                        Total: ${lineItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Entries</h4>
                                    <div className={cn("text-sm font-bold", isBalanced ? "text-success" : "text-destructive")}>
                                        {isBalanced ? "Balanced" : `Off by $${Math.abs(totalDebits - totalCredits).toFixed(2)}`}
                                    </div>
                                </div>

                                {rows.map((row, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-end">
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
                                        <div className="w-full sm:w-24">
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
                                        <div className="w-full sm:w-32">
                                            <Label className="text-xs">Amount</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={row.amount}
                                                onChange={(e) => updateRow(index, 'amount', e.target.value)}
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeRow(index)} disabled={rows.length <= 2} className="self-end sm:self-auto">
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                ))}

                                <Button variant="outline" size="sm" onClick={addRow} className="w-full">
                                    <Plus className="mr-2 h-4 w-4" /> Add Split
                                </Button>
                            </>
                        )}
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
