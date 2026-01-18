'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowUpRight, ArrowDownLeft, ShoppingBag, Coffee, Zap, DollarSign, Layers } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

// Use a simplified type or reuse ReportTransaction
import { ReportTransaction } from "@/actions/reports"

interface RecentTransactionsProps {
    transactions: ReportTransaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    })

    const getIcon = (category: string) => {
        const c = category.toLowerCase()
        if (c.includes('food') || c.includes('coffee') || c.includes('starbucks')) return <Coffee className="h-4 w-4" />
        if (c.includes('util') || c.includes('electric') || c.includes('bill')) return <Zap className="h-4 w-4" />
        if (c.includes('shop') || c.includes('amazon')) return <ShoppingBag className="h-4 w-4" />
        if (c.includes('salary') || c.includes('income')) return <DollarSign className="h-4 w-4" />
        return <Layers className="h-4 w-4" />
    }

    return (
        <Card className="col-span-1 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
                    <CardDescription>
                        Latest financial activity
                    </CardDescription>
                </div>
                <Link href="/reports" className="text-sm font-medium text-primary hover:underline">
                    View All
                </Link>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {transactions.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No recent transactions.</div>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 min-w-0 flex-1">
                                    <Avatar className="h-10 w-10 border bg-muted/50 flex-shrink-0">
                                        <AvatarFallback className="bg-transparent text-muted-foreground">
                                            {getIcon(tx.category)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-sm font-medium leading-none truncate">{tx.description}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {new Date(tx.date).toLocaleDateString()} &middot; <span className="capitalize">{tx.category}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0 pl-2">
                                    <span className={`font-bold ${tx.type === 'INCOME' ? 'text-green-600' : ''}`}>
                                        {tx.type === 'INCOME' ? '+' : '-'}{currencyFormatter.format(tx.amount)}
                                    </span>
                                    <Badge variant={tx.type === 'INCOME' ? 'secondary' : 'outline'} className="text-[10px] h-5 px-1.5 font-normal">
                                        {tx.type === 'INCOME' ? 'completed' : 'completed'}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
