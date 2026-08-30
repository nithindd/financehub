'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { startOfMonth, endOfMonth, subMonths, startOfYear, subDays } from "date-fns"
import { Account } from "@/actions/accounts"

interface ReportFiltersProps {
    accounts?: Account[] // Optional to avoid breaking if not passed yet
}

export function ReportFilters({ accounts = [] }: ReportFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Default to current params or generic defaults (handled in page, but for UI state)
    const [start, setStart] = useState(searchParams.get('start') || '')
    const [end, setEnd] = useState(searchParams.get('end') || '')
    const [accountId, setAccountId] = useState(searchParams.get('accountId') || 'all')
    const [type, setType] = useState(searchParams.get('type') || 'all')

    const updateParams = (newParams: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(newParams).forEach(([key, value]) => {
            if (value && value !== 'all') {
                params.set(key, value)
            } else {
                params.delete(key)
            }
        })
        router.push(`/reports?${params.toString()}`)
    }

    const applyDates = (s: Date, e: Date) => {
        const sStr = s.toISOString().split('T')[0]
        const eStr = e.toISOString().split('T')[0]
        setStart(sStr)
        setEnd(eStr)
        updateParams({ start: sStr, end: eStr })
    }

    const applyCustom = () => {
        if (start && end) {
            updateParams({ start, end })
        }
    }

    const handleAccountChange = (val: string) => {
        setAccountId(val)
        updateParams({ accountId: val })
    }

    const handleTypeChange = (val: string) => {
        setType(val)
        updateParams({ type: val })
    }

    return (
        <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg border">
            {/* Top Row: Presets */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="grid gap-2">
                    <span className="text-sm font-medium">Date Presets</span>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => applyDates(startOfMonth(new Date()), endOfMonth(new Date()))}>
                            This Month
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                            const lastMonth = subMonths(new Date(), 1)
                            applyDates(startOfMonth(lastMonth), endOfMonth(lastMonth))
                        }}>
                            Last Month
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applyDates(startOfYear(new Date()), new Date())}>
                            YTD
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applyDates(subDays(new Date(), 30), new Date())}>
                            Last 30 Days
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Filters & Custom Date */}
            <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
                {/* Account Filter */}
                <div className="grid gap-2 min-w-[200px]">
                    <span className="text-sm font-medium">Filter by Account</span>
                    <Select value={accountId} onValueChange={handleAccountChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Accounts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Accounts</SelectItem>
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Type Filter */}
                <div className="grid gap-2 min-w-[150px]">
                    <span className="text-sm font-medium">Filter by Type</span>
                    <Select value={type} onValueChange={handleTypeChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="ASSET">Assets</SelectItem>
                            <SelectItem value="LIABILITY">Liabilities</SelectItem>
                            <SelectItem value="INCOME">Income</SelectItem>
                            <SelectItem value="EXPENSE">Expenses</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2 items-end ml-auto">
                    <div className="grid gap-2">
                        <span className="text-sm font-medium">From</span>
                        <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-auto" />
                    </div>
                    <div className="grid gap-2">
                        <span className="text-sm font-medium">To</span>
                        <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-auto" />
                    </div>
                    <Button onClick={applyCustom}>Apply</Button>
                </div>
            </div>
        </div>
    )
}
