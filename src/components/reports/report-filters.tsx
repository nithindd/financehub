'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { startOfMonth, endOfMonth, subMonths, startOfYear, subDays } from "date-fns"

export function ReportFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Default to current params or generic defaults (handled in page, but for UI state)
    const [start, setStart] = useState(searchParams.get('start') || '')
    const [end, setEnd] = useState(searchParams.get('end') || '')

    const applyDates = (s: Date, e: Date) => {
        const sStr = s.toISOString().split('T')[0]
        const eStr = e.toISOString().split('T')[0]
        setStart(sStr)
        setEnd(eStr)
        router.push(`/reports?start=${sStr}&end=${eStr}`)
    }

    const applyCustom = () => {
        if (start && end) {
            router.push(`/reports?start=${start}&end=${end}`)
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="grid gap-2">
                <span className="text-sm font-medium">Presets</span>
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

            <div className="flex flex-col sm:flex-row gap-2 sm:items-end w-full sm:w-auto sm:ml-auto">
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
    )
}
