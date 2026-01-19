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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Calendar as CalendarIcon, Loader2, Upload, X, Trash2, Plus, Camera, Scan, Info, Check } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { DatePicker } from "@/components/ui/date-picker"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getAccounts, type Account } from '@/actions/accounts'
import { createTransaction, createTransactionBatch, checkPossibleDuplicate } from '@/actions/transactions'
import { processInvoice } from '@/actions/ocr'
import { getUserPreferences } from '@/actions/profile'
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

export function TransactionDialog({ children, defaultOpenOcr = false, open: controlledOpen, onOpenChange: setControlledOpen, initialFile }: { children: React.ReactNode, defaultOpenOcr?: boolean, open?: boolean, onOpenChange?: (open: boolean) => void, initialFile?: File | null }) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [showOcr, setShowOcr] = useState(defaultOpenOcr)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = (value: boolean) => {
        if (isControlled) {
            setControlledOpen?.(value)
        } else {
            setInternalOpen(value)
        }
    }

    // Effect to process initial file if provided
    useEffect(() => {
        if (open && initialFile) {
            const processInitialFile = async () => {
                const event = {
                    target: {
                        files: [initialFile]
                    }
                } as unknown as React.ChangeEvent<HTMLInputElement>
                await handleFileUpload(event)
            }
            processInitialFile()
        }
    }, [open, initialFile])

    useEffect(() => {
        if (open && defaultOpenOcr && !initialFile) {
            setShowOcr(true)
        }
        if (open && initialFile) {
            setMode('scan')
        }
    }, [open, defaultOpenOcr, initialFile])

    const [date, setDate] = useState<Date | undefined>(new Date())
    const [vendor, setVendor] = useState('')
    const [description, setDescription] = useState('')
    const [rows, setRows] = useState<JournalEntryRow[]>([
        { accountId: '', type: 'DEBIT', amount: '' },
        { accountId: '', type: 'CREDIT', amount: '' }
    ])
    const [accounts, setAccounts] = useState<Account[]>([])
    // Mode: 'edit' is the standard form, 'scan' is the dedicated scanning state
    const [mode, setMode] = useState<'edit' | 'scan'>('edit')
    const [loading, setLoading] = useState(false)
    const [ocrLoading, setOcrLoading] = useState(false)
    const [evidencePath, setEvidencePath] = useState<string | null>(null)
    const [lineItems, setLineItems] = useState<LineItem[]>([])
    const [bankAccountId, setBankAccountId] = useState('')
    const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    // Currency State
    const [currency, setCurrency] = useState('USD')
    const [exchangeRate, setExchangeRate] = useState('1.0')
    const [userBaseCurrency, setUserBaseCurrency] = useState('USD')

    // Duplicate Detection State
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false)

    // Debounce values for duplicate checking
    const debouncedAmount = useDebounce(
        lineItems.length > 0
            ? lineItems.reduce((sum, item) => sum + item.amount, 0)
            : rows.reduce((sum, row) => sum + (row.type === 'DEBIT' ? (parseFloat(row.amount) || 0) : 0), 0),
        800
    )
    const debouncedVendor = useDebounce(vendor || description, 800)
    const debouncedDate = useDebounce(date, 800)

    // Effect to check for duplicates
    useEffect(() => {
        const check = async () => {
            if (!debouncedDate || !debouncedAmount || debouncedAmount <= 0) {
                setDuplicateWarning(null)
                return
            }

            setIsCheckingDuplicates(true)
            try {
                const duplicates = await checkPossibleDuplicate({
                    date: debouncedDate,
                    amount: debouncedAmount,
                    description: debouncedVendor
                })

                if (duplicates.length > 0) {
                    setDuplicateWarning(`Found ${duplicates.length} similar transaction(s) on ${debouncedDate.toLocaleDateString()}`)
                } else {
                    setDuplicateWarning(null)
                }
            } catch (error) {
                console.error("Error checking duplicates:", error)
            } finally {
                setIsCheckingDuplicates(false)
            }
        }

        check()
    }, [debouncedDate, debouncedAmount, debouncedVendor])

    // Fetch accounts on open
    useEffect(() => {
        if (open) {
            getAccounts().then(setAccounts)
            getUserPreferences().then(prefs => {
                if (prefs.currency) {

                    setCurrency(prefs.currency)
                    setUserBaseCurrency(prefs.currency)
                }
            })

            if (defaultOpenOcr) {
                setMode('scan')
                // Small timeout to ensure DOM is ready
                setTimeout(() => {
                    fileInputRef.current?.click()
                }, 100)
            } else {
                setMode('edit')
            }
        }
    }, [open, defaultOpenOcr])

    const getAccountPaymentMethods = (accountId: string) => {
        const acc = accounts.find(a => a.id === accountId)
        return acc?.payment_methods || []
    }

    const addRow = () => {
        setRows([...rows, { accountId: '', type: 'DEBIT', amount: '' }])
    }

    const removeRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index))
    }

    const updateRow = (index: number, field: keyof JournalEntryRow, value: string) => {
        const newRows = [...rows]
        newRows[index] = { ...newRows[index], [field]: value }

        if (field === 'accountId') {
            const pms = getAccountPaymentMethods(value)
            if (pms.length === 1) {
                setPaymentMethodId(pms[0].id)
            } else if (pms.length > 1) {
                setPaymentMethodId(null)
            }
        }

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

        // For private buckets, we store the path, not the public URL.
        // The server will generate a signed URL when reading.
        setEvidencePath(fileName)

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

                // Switch to edit mode to show the form with populated data
                setMode('edit')

                if (vendor) {
                    setVendor(vendor)
                    setDescription(vendor)
                }


                // Find potential accounts
                const expenseAcc = accounts.find(a => a.type === 'EXPENSE')
                const assetAcc = accounts.find(a => a.type === 'ASSET' || a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank'))

                if (assetAcc) setBankAccountId(assetAcc.id)

                let calcLineItems: LineItem[] = []
                if (items && Array.isArray(items) && items.length > 0) {
                    calcLineItems = items.map((item: any) => ({
                        description: item.description,
                        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount,
                        accountId: expenseAcc?.id || ''
                    }))

                    // Add Tax if present
                    if (tax && typeof tax === 'number' && tax > 0) {
                        calcLineItems.push({
                            description: "Tax",
                            amount: tax,
                            accountId: expenseAcc?.id || ''
                        })
                    }

                    // Add Tip if present
                    if (tip && typeof tip === 'number' && tip > 0) {
                        calcLineItems.push({
                            description: "Tip",
                            amount: tip,
                            accountId: expenseAcc?.id || ''
                        })
                    }

                    setLineItems(calcLineItems)
                    // Clear simple rows if we have line items
                    setRows([])
                } else if (totalAmount && accounts.length > 0) {
                    // Fallback to simple rows logic
                    const amountValue = typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount
                    if (!isNaN(amountValue)) {
                        const amountStr = amountValue.toFixed(2)
                        const newRows: JournalEntryRow[] = []
                        if (expenseAcc) newRows.push({ accountId: expenseAcc.id, type: 'DEBIT', amount: amountStr })
                        if (assetAcc) newRows.push({ accountId: assetAcc.id, type: 'CREDIT', amount: amountStr })
                        if (newRows.length > 0) setRows(newRows)
                    }
                }

                // Parse Date and Check Duplicates
                if (dateStr) {
                    // NOON Fix for Timezones
                    const [y, m, d] = dateStr.split('-').map(Number)
                    if (y && m && d) {
                        const localDate = new Date(y, m - 1, d, 12, 0, 0)
                        if (!isNaN(localDate.getTime())) {
                            // Check for duplicates (removed blocking confirm, using reactive UI instead)
                            setDate(localDate)
                        }
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
                evidencePath: index === 0 ? (evidencePath || undefined) : undefined,
                vendor: vendor,
                items: lineItems,
                currency,
                exchangeRate: parseFloat(exchangeRate),
                paymentMethodId: index === 0 ? (paymentMethodId || undefined) : undefined
            })).map(b => ({ ...b, paymentMethodId: paymentMethodId || undefined }))

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
                evidencePath: evidencePath || undefined,
                vendor: vendor,
                items: lineItems,
                currency,
                exchangeRate: parseFloat(exchangeRate),
                paymentMethodId: paymentMethodId || undefined
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
        setVendor('')
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

    // Compute available payment methods based on selected accounts
    const relevantAccounts = mode === 'scan' && bankAccountId
        ? [accounts.find(a => a.id === bankAccountId)].filter(Boolean) as Account[]
        : rows.map(r => accounts.find(a => a.id === r.accountId)).filter(Boolean) as Account[]

    const uniquePaymentMethods = Array.from(new Set(relevantAccounts.flatMap(a => a?.payment_methods || []).map(pm => pm.id)))
        .map(id => relevantAccounts.flatMap(a => a?.payment_methods || []).find(pm => pm.id === id)!)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === 'scan' ? 'Scan Invoice' : 'New Transaction'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'scan'
                            ? 'Upload an invoice to auto-fill transaction details.'
                            : 'Enter a double-entry transaction. Ensure debits equal credits.'
                        }
                    </DialogDescription>
                </DialogHeader>

                {mode === 'scan' ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="rounded-full bg-blue-50 p-4">
                            <Upload className="h-8 w-8 text-blue-500" />
                        </div>
                        <p className="text-center text-sm text-muted-foreground max-w-xs">
                            Take a photo or upload an invoice (Image or PDF) to extract details automatically.
                        </p>

                        <input
                            type="file"
                            ref={cameraInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileUpload}
                        />

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                        />

                        <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
                            <Button
                                onClick={() => cameraInputRef.current?.click()}
                                disabled={ocrLoading}
                                className="w-full"
                            >
                                {ocrLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                                Take Photo
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={ocrLoading}
                                className="w-full"
                            >
                                {ocrLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Upload File
                            </Button>

                            <Button variant="ghost" onClick={() => setOpen(false)} className="w-full">
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>

                        {/* OCR Button in Edit Mode */}
                        <div className="flex justify-center py-2 border-b border-dashed">
                            <input
                                type="file"
                                // Ref is shared, but we only need it here if we want to re-trigger upload from edit mode
                                // We can assign it conditionally or keep it. 
                                // To allow re-use, we'll use a separate input or reuse the ref if 'scan' mode isn't active.
                                // Actually, let's just reuse the ref logic but ensure we don't duplicate the input element implementation if possible.
                                // For simplicity, we can have the input here too but it might conflict if we use the same ref.
                                // Let's use a callback for the click.
                                ref={mode === 'edit' ? fileInputRef : undefined}
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

                        <Alert variant="destructive" className="my-2 py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-sm font-semibold">Security Warning</AlertTitle>
                            <AlertDescription className="text-xs">
                                Do not upload documents containing unredacted credit card numbers or bank account details. Please black out sensitive info before uploading.
                            </AlertDescription>
                        </Alert>

                        {evidencePath && (
                            <div className="flex items-center justify-center gap-2 py-1 text-xs text-success bg-success/5 border-b">
                                <Check className="h-3 w-3" />
                                File attached and will be linked to this transaction
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="sm:text-right">
                                Date
                            </Label>
                            <div className="sm:col-span-3">
                                <DatePicker date={date} setDate={setDate} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="vendor" className="sm:text-right">
                                Vendor
                            </Label>
                            <Input
                                id="vendor"
                                value={vendor}
                                placeholder="e.g. Home Depot (Optional)"
                                onChange={(e) => setVendor(e.target.value)}
                                className="sm:col-span-3"
                            />
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

                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="currency" className="sm:text-right">Currency</Label>
                            <div className="sm:col-span-3 flex gap-2">
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger className="w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'].map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {currency !== userBaseCurrency && (
                                    <div className="flex items-center gap-2 flex-1">
                                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Ex. Rate (1 {currency} = ? {userBaseCurrency})</Label>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={exchangeRate}
                                            onChange={e => setExchangeRate(e.target.value)}
                                            placeholder="Rate"
                                            className="w-24"
                                        />
                                    </div>
                                )}
                            </div>
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
                                                        {accounts.map(acc => {
                                                            const pmName = acc.payment_methods?.[0] ? ` - ${acc.payment_methods[0].name} (...${acc.payment_methods[0].last_four})` : ''
                                                            return (
                                                                <SelectItem key={acc.id} value={acc.id}>
                                                                    {acc.name} ({acc.type}){pmName}
                                                                </SelectItem>
                                                            )
                                                        })}
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



                        {/* Payment Method Selector - Show if any available */}
                        {uniquePaymentMethods.length > 0 && (
                            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-md border border-dashed">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Label className="text-xs whitespace-nowrap">Payment Method (Optional)</Label>
                                </div>
                                <Select
                                    value={paymentMethodId || "none"}
                                    onValueChange={(val) => setPaymentMethodId(val === "none" ? null : val)}
                                >
                                    <SelectTrigger className="h-8 text-xs w-full max-w-xs bg-white">
                                        <SelectValue placeholder="Select Card (Default: None/Cash)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None / Cash</SelectItem>
                                        {uniquePaymentMethods.map(pm => (
                                            <SelectItem key={pm.id} value={pm.id}>
                                                {pm.name} (...{pm.last_four})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <DialogFooter>
                            <Button onClick={handleSubmit} disabled={!isValid || loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Transaction
                            </Button>
                        </DialogFooter>
                    </>
                )
                }
            </DialogContent >
        </Dialog >
    )
}
