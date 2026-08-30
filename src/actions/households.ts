'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'

export interface HouseholdMember {
    userId: string
    username: string
    role: 'owner' | 'member'
}

export interface Household {
    id: string
    name: string
    members: HouseholdMember[]
}

export interface HouseholdInvitation {
    id: string
    householdId: string
    invitedEmail: string
    status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired'
    createdAt: string
    expiresAt: string
}

export interface SharingScopes {
    accounts: boolean
    transactions: boolean
    creditors: boolean
}

/**
 * Creates a household and makes the current user its owner. A user can own/belong
 * to multiple households (e.g. "immediate family" and "roommates" separately) —
 * membership is entirely via household_members, there's no "current household"
 * column to update.
 */
export async function createHousehold(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: household, error } = await supabase
        .from('households')
        .insert({ name, created_by: user.id })
        .select()
        .single()

    if (error) return { success: false, error: error.message }

    const { error: memberError } = await supabase
        .from('household_members')
        .insert({ household_id: household.id, user_id: user.id, role: 'owner' })

    if (memberError) return { success: false, error: memberError.message }

    revalidatePath('/settings')
    return { success: true, householdId: household.id }
}

/**
 * Owner-only (enforced by RLS): creates a pending invitation and emails it.
 * `invited_email` is a plain text column, not a foreign key to auth.users — the
 * invited person does not need an existing account. If they don't have one yet,
 * the email includes a sign-up link (pre-filled with this exact email address);
 * once they sign up and sign in, "Invited user can view own invitations" (RLS,
 * matched by their auth session's email) makes the same pending invitation
 * visible to them automatically — no separate "claim" step needed. The invitee
 * lands on /settings/household/invitations/[id] and /signup either way — both
 * routes are Phase 2 UI work, not built yet; NEXT_PUBLIC_SITE_URL also isn't in
 * .env.local yet, so the links below will be relative/broken until that's added.
 */
export async function inviteMemberByEmail(householdId: string, email: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: household } = await supabase.from('households').select('name').eq('id', householdId).maybeSingle()
    if (!household) return { success: false, error: 'Household not found' }

    const { data: invitation, error } = await supabase
        .from('household_invitations')
        .insert({ household_id: householdId, invited_email: email, invited_by: user.id })
        .select()
        .single()

    if (error) return { success: false, error: error.message }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    const acceptUrl = `${siteUrl}/settings/household/invitations/${invitation.id}`
    const signUpUrl = `${siteUrl}/signup?email=${encodeURIComponent(email)}&invitation=${invitation.id}`

    await sendEmail({
        to: email,
        subject: `You've been invited to join "${household.name}" on FinanceHub`,
        html: `<p>You've been invited to join the <strong>${household.name}</strong> household on FinanceHub.</p>
               <p>Already have a FinanceHub account with this email? <a href="${acceptUrl}">Sign in and respond to the invitation</a>.</p>
               <p>New to FinanceHub? <a href="${signUpUrl}">Create an account with this email address</a> — the invitation will be waiting for you once you're signed in.</p>
               <p>This invitation expires in 7 days.</p>`,
    })

    revalidatePath('/settings')
    return { success: true, invitationId: invitation.id }
}

export async function listMyPendingInvitations(): Promise<HouseholdInvitation[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('household_invitations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    if (error || !data) return []

    return data.map((row: any) => ({
        id: row.id,
        householdId: row.household_id,
        invitedEmail: row.invited_email,
        status: row.status,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
    }))
}

/** Accepts an invitation addressed to the current user's own email, then joins the household. */
export async function acceptInvitation(invitationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: invitation, error: fetchError } = await supabase
        .from('household_invitations')
        .select('*')
        .eq('id', invitationId)
        .maybeSingle()

    if (fetchError || !invitation) return { success: false, error: 'Invitation not found' }
    if (invitation.status !== 'pending') return { success: false, error: `Invitation is already ${invitation.status}` }

    const { error: updateError } = await supabase
        .from('household_invitations')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', invitationId)

    if (updateError) return { success: false, error: updateError.message }

    // RLS on household_members now allows this insert because the invitation is accepted.
    // No "current household" column to update — a user can belong to several households.
    const { error: memberError } = await supabase
        .from('household_members')
        .insert({ household_id: invitation.household_id, user_id: user.id, role: 'member' })

    if (memberError) return { success: false, error: memberError.message }

    revalidatePath('/settings')
    return { success: true }
}

export async function declineInvitation(invitationId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('household_invitations')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', invitationId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/settings')
    return { success: true }
}

export async function revokeInvitation(invitationId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('household_invitations')
        .update({ status: 'revoked', responded_at: new Date().toISOString() })
        .eq('id', invitationId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/settings')
    return { success: true }
}

/** Leaves this one household; membership in any other households is unaffected. */
export async function leaveHousehold(householdId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase.from('household_members').delete().eq('household_id', householdId).eq('user_id', user.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/settings')
    return { success: true }
}

/**
 * Sets which data domains this user shares with their household's family view.
 * Granular per your requirement — e.g. share creditors (debt) without sharing
 * day-to-day transactions. Does not affect this user's own individual view.
 */
export async function updateSharingScopes(scopes: SharingScopes) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
        .from('user_preferences')
        .upsert({
            user_id: user.id,
            share_accounts_with_household: scopes.accounts,
            share_transactions_with_household: scopes.transactions,
            share_creditors_with_household: scopes.creditors,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

    if (error) return { success: false, error: error.message }

    revalidatePath('/settings')
    return { success: true }
}

export async function getSharingScopes(): Promise<SharingScopes> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { accounts: false, transactions: false, creditors: false }

    const { data } = await supabase
        .from('user_preferences')
        .select('share_accounts_with_household, share_transactions_with_household, share_creditors_with_household')
        .eq('user_id', user.id)
        .maybeSingle()

    return {
        accounts: data?.share_accounts_with_household ?? false,
        transactions: data?.share_transactions_with_household ?? false,
        creditors: data?.share_creditors_with_household ?? false,
    }
}

/** All households the current user belongs to (a user may belong to several — e.g. family + roommates). */
export async function listMyHouseholds(): Promise<Household[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: memberships } = await supabase
        .from('household_members')
        .select('household_id, households!inner(id, name)')
        .eq('user_id', user.id)

    if (!memberships || memberships.length === 0) return []

    const households = await Promise.all(
        memberships.map(async (m: any) => {
            const { data: members } = await supabase
                .from('household_members')
                .select('user_id, role, profiles!inner(username)')
                .eq('household_id', m.household_id)

            return {
                id: m.households.id,
                name: m.households.name,
                members: (members || []).map((mm: any) => ({ userId: mm.user_id, username: mm.profiles.username, role: mm.role })),
            }
        })
    )

    return households
}

// Note: there is no separate "household creditors" query here anymore.
// src/actions/debts.ts: listCreditors() is itself context-aware (see
// src/lib/household-context.ts) — it returns the signed-in user's own creditors
// in their individual view, or the whole household's shared creditors once a
// household profile is selected via switchActiveContext(). Every page that lists
// creditors automatically follows whatever profile is active without needing a
// household-specific variant.
