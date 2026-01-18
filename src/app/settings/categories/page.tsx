import { createClient } from '@/utils/supabase/server'
import { getAccounts } from '@/actions/accounts'
import { redirect } from 'next/navigation'
import { CategoriesClient } from '@/components/settings/categories-client'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function CategoriesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const accounts = await getAccounts()

    return (
        <DashboardShell>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manage Categories</h1>
                    <p className="text-muted-foreground">Customize your income and expense categories.</p>
                </div>

                <div className="mx-auto grid w-full max-w-4xl">
                    <CategoriesClient initialAccounts={accounts} />
                </div>
            </div>
        </DashboardShell>
    )
}
