import { createClient } from '@/utils/supabase/server'
import { getAccounts } from '@/actions/accounts'
import { redirect } from 'next/navigation'
import { CategoriesClient } from '@/components/settings/categories-client'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function CategoriesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const accounts = await getAccounts()

    return (
        <DashboardShell>
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/profile">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manage Categories</h1>
                        <p className="text-muted-foreground">Customize your income and expense categories.</p>
                    </div>
                </div>

                <div className="mx-auto grid w-full max-w-4xl">
                    <CategoriesClient initialAccounts={accounts} />
                </div>
            </div>
        </DashboardShell>
    )
}
