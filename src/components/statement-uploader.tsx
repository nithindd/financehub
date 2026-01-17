'use client'

import { useState, useRef } from 'react'
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
import { FileText, Upload, Loader2, Check } from "lucide-react"
import Papa from 'papaparse'
import { createTransaction } from '@/actions/transactions'
import { getAccounts, type Account } from '@/actions/accounts'

export function StatementUploader({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [parsedRows, setParsedRows] = useState<any[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [targetAccountId, setTargetAccountId] = useState('')

    // Load accounts when opening
    useState(() => {
        getAccounts().then(setAccounts)
    })

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setParsedRows(results.data.slice(0, 5)) // Preview first 5
                setLoading(false)
            },
            error: (err) => {
                alert("Failed to parse CSV: " + err.message)
                setLoading(false)
            }
        })
    }

    const handleImport = async () => {
        // This is a placeholder for the actual bulk import logic
        // In a real app, we'd map columns (Date -> 'Date', Desc -> 'Paysee', etc)
        // For now, we just acknowledge the user intent.
        alert("Bulk Import logic would go here. Mapping each row to a Transaction + Journal Entries.")
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Import Statement</DialogTitle>
                    <DialogDescription>
                        Upload a CSV bank statement. We will attempt to auto-categorize transactions.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!parsedRows.length && (
                        <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-muted-foreground">
                            <FileText className="h-10 w-10 mb-2" />
                            <p>Drag and drop CSV here or click to browse</p>
                            <Input type="file" accept=".csv" className="mt-4 w-64" onChange={handleFileUpload} />
                        </div>
                    )}

                    {parsedRows.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-medium">Preview (First 5 Rows)</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {Object.keys(parsedRows[0]).map((head) => (
                                            <TableHead key={head}>{head}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedRows.map((row, i) => (
                                        <TableRow key={i}>
                                            {Object.values(row).map((cell: any, j) => (
                                                <TableCell key={j}>{cell}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <p className="text-sm text-muted-foreground">
                                * Note: In a full implementation, you would select which column maps to Date, Amount, Description.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {parsedRows.length > 0 && (
                        <Button onClick={handleImport}>
                            <Check className="mr-2 h-4 w-4" /> Import Transactions
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
