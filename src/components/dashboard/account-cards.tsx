'use client'

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, Building2, PiggyBank } from "lucide-react"
import { AccountBalance } from "@/actions/accounts"
import { cn } from "@/lib/utils"

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
                <Card key={account.id} className="relative overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            {getIcon(account.name, account.type)}
                            {account.name}
                        </CardTitle>
                        {/* Optional: Add badge or percent change if we had historical data */}
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-2xl font-bold",
                            account.balance < 0 && account.type === 'ASSET' ? "text-destructive" : "", // Overdrawn Asset
                            // Liabilities are normally positive number representing debt, but logically negative net worth.
                            // However, in our balance func: Liability Balance = Credit - Debit. 
                            // So a positive balance means we OWE money. 
                        )}>
                            {currencyFormatter.format(account.balance)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {account.type === 'ASSET' ? 'Available Balance' : 'Outstanding Balance'}
                        </p>

                        <div className="flex items-center gap-2 mt-4">
                            <Button size="sm" className="w-full h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white">
                                Send
                            </Button>
                            <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                                Receive
                            </Button>
                        </div>
                    </CardContent>
                </Card>
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
