import { createClient } from '@/utils/supabase/server'
import { getAccounts } from '@/actions/accounts'
import { redirect } from 'next/navigation'
import { CategoriesClient } from '@/components/settings/categories-client'
import { Header } from '@/components/layout/header'

export default async function CategoriesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const accounts = await getAccounts()

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <Header title="Manage Categories" showBack={true} backHref="/profile" />

            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="mx-auto grid w-full max-w-4xl">
                    <CategoriesClient initialAccounts={accounts} />
                </div>
            </main>
        </div>
    )
}
