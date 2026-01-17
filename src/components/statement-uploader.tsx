'use client'

import { useState, useRef, useEffect } from 'react'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FileText, Upload, Loader2, Check, AlertCircle } from "lucide-react"
import Papa from 'papaparse'
import { createTransaction } from '@/actions/transactions'
import { getAccounts, type Account } from '@/actions/accounts'
import { cn } from '@/lib/utils'

export function StatementUploader({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [rawData, setRawData] = useState<any[]>([])
    const [headers, setHeaders] = useState<string[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])

    // Mapping State
    const [targetAccountId, setTargetAccountId] = useState('')
    const [dateCol, setDateCol] = useState('')
    const [descCol, setDescCol] = useState('')
    const [amountCol, setAmountCol] = useState('')

    // Load accounts
    useEffect(() => {
        if (open) {
            getAccounts().then(setAccounts)
        }
    }, [open])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data as any[]
                setRawData(data)
                if (data.length > 0) {
                    setHeaders(Object.keys(data[0]))
                }
                setLoading(false)
            },
            error: (err) => {
                alert("Failed to parse CSV: " + err.message)
                setLoading(false)
            }
        })
    }

    const handleImport = async () => {
        if (!targetAccountId || !dateCol || !descCol || !amountCol) {
            alert("Please fill in all mapping fields.")
            return
        }

        setImporting(true)
        let successCount = 0
        let errorCount = 0

        // Find Expense account for balancing
        const expenseAcc = accounts.find(a => a.type === 'EXPENSE')

        for (const row of rawData) {
            const dateStr = row[dateCol]
            const desc = row[descCol]
            const rawAmount = row[amountCol]

            // Basic cleaning
            const amount = Math.abs(parseFloat(rawAmount.replace(/[^0-9.-]+/g, "")))
            const isDebit = parseFloat(rawAmount.replace(/[^0-9.-]+/g, "")) < 0

            if (!dateStr || isNaN(amount)) {
                errorCount++
                continue
            }

            try {
                // Determine splits: 
                // If amount is negative (debit in bank sense? or expense?), we map accordingly.
                // Usually banks: - is Money Out (Expense), + is Money In (Income/Transfer)
                // We'll simplify: All rows are transactions between the target account and the 'Office Supplies' or similar.

                const result = await createTransaction({
                    date: new Date(dateStr),
                    description: desc,
                    entries: [
                        { accountId: targetAccountId, type: isDebit ? 'CREDIT' : 'DEBIT', amount: amount },
                        { accountId: expenseAcc?.id || '', type: isDebit ? 'DEBIT' : 'CREDIT', amount: amount }
                    ]
                })

                if (result.success) successCount++
                else errorCount++
            } catch (e) {
                errorCount++
            }
        }

        setImporting(false)
        alert(`Import Complete! Successfully created ${successCount} transactions. Errors: ${errorCount}`)
        setOpen(false)
        setRawData([])
    }

    const isMappingValid = targetAccountId && dateCol && descCol && amountCol

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Statement</DialogTitle>
                    <DialogDescription>
                        Upload a CSV bank statement. Map columns to import transactions.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Step 1: Upload */}
                    {!rawData.length && (
                        <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-muted-foreground">
                            {loading ? <Loader2 className="h-10 w-10 animate-spin mb-2" /> : <FileText className="h-10 w-10 mb-2" />}
                            <p>{loading ? "Parsing CSV..." : "Select your bank statement CSV"}</p>
                            <Input type="file" accept=".csv" className="mt-4 w-64" onChange={handleFileUpload} disabled={loading} />
                        </div>
                    )}

                    {/* Step 2: Map & Preview */}
                    {rawData.length > 0 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
                                <div className="space-y-2">
                                    <Label>Target Bank/Asset Account</Label>
                                    <Select value={targetAccountId} onValueChange={setTargetAccountId}>
                                        <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                                        <SelectContent>
                                            {accounts.filter(a => a.type === 'ASSET' || a.type === 'LIABILITY').map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date Column</Label>
                                    <Select value={dateCol} onValueChange={setDateCol}>
                                        <SelectTrigger><SelectValue placeholder="Select Column" /></SelectTrigger>
                                        <SelectContent>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description Column</Label>
                                    <Select value={descCol} onValueChange={setDescCol}>
                                        <SelectTrigger><SelectValue placeholder="Select Column" /></SelectTrigger>
                                        <SelectContent>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount Column</Label>
                                    <Select value={amountCol} onValueChange={setAmountCol}>
                                        <SelectTrigger><SelectValue placeholder="Select Column" /></SelectTrigger>
                                        <SelectContent>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">Preview (First 3 Rows)</h3>
                                <div className="border rounded-md overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted">
                                            <TableRow>
                                                {headers.map((h) => <TableHead key={h}>{h}</TableHead>)}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rawData.slice(0, 3).map((row, i) => (
                                                <TableRow key={i}>
                                                    {headers.map((h) => <TableCell key={h}>{row[h]}</TableCell>)}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    {rawData.length > 0 && (
                        <div className="flex w-full items-center justify-between">
                            <Button variant="ghost" onClick={() => setRawData([])}>Reset</Button>
                            <Button onClick={handleImport} disabled={!isMappingValid || importing}>
                                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                {importing ? "Importing..." : `Import ${rawData.length} Transactions`}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

