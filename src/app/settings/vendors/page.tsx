import { createClient } from '@/utils/supabase/server'
import { getVendorMappings } from '@/actions/vendors'
import { getAccounts } from '@/actions/accounts'
import { redirect } from 'next/navigation'
import { VendorMappingsClient } from '@/components/settings/vendor-mappings-client'
import { Header } from '@/components/layout/header'

export default async function VendorsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const mappings = await getVendorMappings()
    const accounts = await getAccounts()

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <Header title="Vendor Mappings" showBack={true} backHref="/profile" />

            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="mx-auto grid w-full max-w-4xl">
                    <VendorMappingsClient initialMappings={mappings} accounts={accounts} />
                </div>
            </main>
        </div>
    )
}
