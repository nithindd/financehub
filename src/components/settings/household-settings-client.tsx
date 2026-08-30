'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Users, Mail, Check, X, LogOut, Plus } from 'lucide-react'
import {
    createHousehold,
    inviteMemberByEmail,
    acceptInvitation,
    declineInvitation,
    leaveHousehold,
    updateSharingScopes,
    type Household,
    type HouseholdInvitation,
    type SharingScopes,
} from '@/actions/households'

interface HouseholdSettingsClientProps {
    households: Household[]
    invitations: HouseholdInvitation[]
    sharingScopes: SharingScopes
    currentUserId: string
}

export function HouseholdSettingsClient({ households, invitations, sharingScopes, currentUserId }: HouseholdSettingsClientProps) {
    const router = useRouter()
    const [newHouseholdName, setNewHouseholdName] = React.useState('')
    const [inviteEmails, setInviteEmails] = React.useState<Record<string, string>>({})
    const [scopes, setScopes] = React.useState(sharingScopes)
    const [busy, setBusy] = React.useState(false)
    const [message, setMessage] = React.useState<string | null>(null)

    const runAction = async (fn: () => Promise<{ success: boolean; error?: string }>) => {
        setBusy(true)
        setMessage(null)
        const result = await fn()
        setBusy(false)
        if (result.success) {
            router.refresh()
        } else {
            setMessage(result.error ?? 'Something went wrong')
        }
    }

    const handleCreateHousehold = () => {
        if (!newHouseholdName.trim()) return
        runAction(async () => {
            const result = await createHousehold(newHouseholdName.trim())
            if (result.success) setNewHouseholdName('')
            return result
        })
    }

    const handleInvite = (householdId: string) => {
        const email = inviteEmails[householdId]?.trim()
        if (!email) return
        runAction(async () => {
            const result = await inviteMemberByEmail(householdId, email)
            if (result.success) setInviteEmails((prev) => ({ ...prev, [householdId]: '' }))
            return result
        })
    }

    const handleSaveScopes = () => {
        runAction(() => updateSharingScopes(scopes))
    }

    return (
        <div className="space-y-6">
            {message && <p className="text-sm text-destructive">{message}</p>}

            {invitations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Pending Invitations
                        </CardTitle>
                        <CardDescription>Households that have invited you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {invitations.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between border rounded-lg p-3">
                                <div className="text-sm">
                                    Invitation to join a household <span className="text-muted-foreground">(sent to {inv.invitedEmail})</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" disabled={busy} onClick={() => runAction(() => acceptInvitation(inv.id))} className="gap-1">
                                        <Check className="h-3.5 w-3.5" />
                                        Accept
                                    </Button>
                                    <Button size="sm" variant="outline" disabled={busy} onClick={() => runAction(() => declineInvitation(inv.id))} className="gap-1">
                                        <X className="h-3.5 w-3.5" />
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Your Households
                    </CardTitle>
                    <CardDescription>
                        A household is a read-only shared view — members never edit each other&apos;s data. You can
                        belong to more than one (e.g. family and roommates, kept separate).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {households.length === 0 && (
                        <p className="text-sm text-muted-foreground">You don&apos;t belong to any households yet.</p>
                    )}

                    {households.map((household) => {
                        const isOwner = household.members.find((m) => m.userId === currentUserId)?.role === 'owner'
                        return (
                            <div key={household.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="font-medium">{household.name}</div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive gap-1"
                                        disabled={busy}
                                        onClick={() => {
                                            if (confirm(`Leave ${household.name}?`)) runAction(() => leaveHousehold(household.id))
                                        }}
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Leave
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {household.members.map((m) => (
                                        <Badge key={m.userId} variant="secondary">
                                            {m.username} {m.role === 'owner' && '(owner)'}
                                        </Badge>
                                    ))}
                                </div>

                                {isOwner && (
                                    <div className="flex gap-2 pt-2">
                                        <Input
                                            type="email"
                                            placeholder="Invite by email"
                                            value={inviteEmails[household.id] ?? ''}
                                            onChange={(e) => setInviteEmails((prev) => ({ ...prev, [household.id]: e.target.value }))}
                                        />
                                        <Button size="sm" disabled={busy} onClick={() => handleInvite(household.id)}>
                                            Invite
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    <div className="flex gap-2 pt-2 border-t">
                        <Input
                            placeholder="New household name"
                            value={newHouseholdName}
                            onChange={(e) => setNewHouseholdName(e.target.value)}
                        />
                        <Button disabled={busy} onClick={handleCreateHousehold} className="gap-1 shrink-0">
                            <Plus className="h-4 w-4" />
                            Create Household
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sharing</CardTitle>
                    <CardDescription>
                        Choose what household members can see when they switch to a shared profile that includes
                        you. Off by default for each. This applies across every household you belong to.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="share-accounts"
                            checked={scopes.accounts}
                            onCheckedChange={(checked) => setScopes((s) => ({ ...s, accounts: !!checked }))}
                        />
                        <Label htmlFor="share-accounts">Share my accounts</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="share-transactions"
                            checked={scopes.transactions}
                            onCheckedChange={(checked) => setScopes((s) => ({ ...s, transactions: !!checked }))}
                        />
                        <Label htmlFor="share-transactions">Share my transactions</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="share-creditors"
                            checked={scopes.creditors}
                            onCheckedChange={(checked) => setScopes((s) => ({ ...s, creditors: !!checked }))}
                        />
                        <Label htmlFor="share-creditors">Share my debts</Label>
                    </div>
                    <Button disabled={busy} onClick={handleSaveScopes} className="mt-2">
                        Save Sharing Settings
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
