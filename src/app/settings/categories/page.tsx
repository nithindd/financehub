import { createClient } from '@/utils/supabase/server'
import { getAccounts } from '@/actions/accounts'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { CategoriesClient } from '@/components/settings/categories-client'

export default async function CategoriesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const accounts = await getAccounts()

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="ghost" size="sm" asChild className="mr-2">
                    <Link href="/profile">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold tracking-tight text-primary">Manage Categories</h1>
            </header>

            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="mx-auto grid w-full max-w-4xl">
                    <CategoriesClient initialAccounts={accounts} />
                </div>
            </main>
        </div>
    )
}
