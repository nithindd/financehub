import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { listMyHouseholds, listMyPendingInvitations, getSharingScopes } from '@/actions/households'
import { HouseholdSettingsClient } from '@/components/settings/household-settings-client'

export default async function HouseholdSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/signin')

    const [households, invitations, sharingScopes] = await Promise.all([
        listMyHouseholds(),
        listMyPendingInvitations(),
        getSharingScopes(),
    ])

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
                        <h1 className="text-2xl font-bold tracking-tight">Household &amp; Family Sharing</h1>
                        <p className="text-muted-foreground">Share a read-only view of your finances with people you trust.</p>
                    </div>
                </div>

                <div className="mx-auto grid w-full max-w-2xl">
                    <HouseholdSettingsClient
                        households={households}
                        invitations={invitations}
                        sharingScopes={sharingScopes}
                        currentUserId={user.id}
                    />
                </div>
            </div>
        </DashboardShell>
    )
}
