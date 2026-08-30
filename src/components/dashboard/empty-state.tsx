'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, PlusCircle, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { TransactionDialog } from "@/components/transaction-dialog"

interface EmptyDashboardStateProps {
    userName: string
}

export function EmptyDashboardState({ userName }: EmptyDashboardStateProps) {
    const [activeSheet, setActiveSheet] = useState<'scan' | 'manual' | 'upload' | null>(null)

    return (
        <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4 max-w-lg">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    <Wallet className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Welcome to FinanceHub, {userName}!
                </h2>
                <p className="text-muted-foreground text-lg">
                    It looks like you're just getting started. Your dashboard is empty because you haven&apos;t added any financial data yet.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 w-full max-w-2xl px-4">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2">
                    <CardContent className="flex flex-col items-center text-center p-8 space-y-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <PlusCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-xl">Set Up Accounts</h3>
                            <p className="text-sm text-muted-foreground">
                                Customize your chart of accounts to match your financial structure.
                            </p>
                        </div>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/settings/categories">
                                Manage Accounts <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2">
                    <CardContent className="flex flex-col items-center text-center p-8 space-y-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <Wallet className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-xl">Start Tracking</h3>
                            <p className="text-sm text-muted-foreground">
                                Add your first transaction or import a statement to see insights.
                            </p>
                        </div>
                        <Button className="w-full" onClick={() => setActiveSheet('manual')}>
                            Add Transaction <Plus className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <TransactionDialog
                open={activeSheet === 'manual'}
                onOpenChange={(open) => !open && setActiveSheet(null)}
            >
                <span className="hidden"></span>
            </TransactionDialog>
        </div>
    )
}
