'use client'

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, Building2, PiggyBank } from "lucide-react"
import { AccountBalance } from "@/actions/accounts"
import { cn } from "@/lib/utils"
import Link from 'next/link'

interface AccountCardsProps {
    accounts: AccountBalance[]
}

export function AccountCards({ accounts }: AccountCardsProps) {
    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    })

    // Filter to only show relevant active accounts (Assets & Liabilities mainly)
    const displayAccounts = accounts.filter(a =>
        ['ASSET', 'LIABILITY'].includes(a.type)
    )

    const getIcon = (name: string, type: string) => {
        const n = name.toLowerCase()
        if (n.includes('bank') || n.includes('checking')) return <Building2 className="h-4 w-4" />
        if (n.includes('save') || n.includes('saving')) return <PiggyBank className="h-4 w-4" />
        if (type === 'LIABILITY' || n.includes('card')) return <CreditCard className="h-4 w-4" />
        return <Wallet className="h-4 w-4" />
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayAccounts.map((account) => (
                <Link href={`/reports?accountId=${account.id}`} key={account.id}>
                    <Card className="relative overflow-hidden transition-all hover:shadow-md hover:border-primary cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                {getIcon(account.name, account.type)}
                                {account.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={cn(
                                "text-2xl font-bold",
                                account.balance < 0 && account.type === 'ASSET' ? "text-destructive" : "",
                            )}>
                                {currencyFormatter.format(account.balance)}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-muted-foreground">
                                    {account.type === 'ASSET' ? 'Available Balance' : 'Outstanding Balance'}
                                </p>
                                {account.payment_methods && account.payment_methods.length > 0 && (
                                    <div className="flex -space-x-2">
                                        {account.payment_methods.map(pm => (
                                            <div key={pm.id} className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-background" title={pm.name}>
                                                <CreditCard className="w-3 h-3 text-primary" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}

            {/* Add Card Placeholder */}
            <Card className="flex flex-col items-center justify-center p-6 border-dashed opacity-70 hover:opacity-100 hover:bg-muted/50 cursor-pointer transition-all">
                <div className="rounded-full bg-muted p-3 mb-2">
                    <Wallet className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium text-muted-foreground">+ Add Account</div>
            </Card>
        </div>
    )
}
