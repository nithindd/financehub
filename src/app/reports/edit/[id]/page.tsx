import { createClient } from '@/utils/supabase/server'
import { getTransactionById } from '@/actions/transactions'
import { getAccounts } from '@/actions/accounts'
import { TransactionDialog } from '@/components/transaction-dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function EditTransactionPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const transaction = await getTransactionById(params.id)
    if (!transaction) {
        return <div className="p-8">Transaction not found</div>
    }

    const accounts = await getAccounts()

    // Convert transaction data to dialog format
    const initialData = {
        id: transaction.id,
        date: new Date(transaction.date),
        description: transaction.description,
        entries: transaction.journal_entries.map((entry: any) => ({
            accountId: entry.account_id,
            type: entry.entry_type as 'DEBIT' | 'CREDIT',
            amount: entry.amount.toString()
        }))
    }

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="ghost" size="sm" asChild className="mr-2">
                    <Link href="/reports">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Reports
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold tracking-tight text-primary">Edit Transaction</h1>
            </header>

            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="mx-auto grid w-full max-w-2xl">
                    <TransactionDialog
                        editMode={true}
                        initialData={initialData}
                        accounts={accounts}
                    >
                        <div />
                    </TransactionDialog>
                </div>
            </main>
        </div>
    )
}
