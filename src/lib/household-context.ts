/**
 * The "profile switcher": once signed in, a user picks either their own
 * individual view or one of their households, and that choice scopes every
 * read across the app (dashboard, reports, debts, etc.) until they switch again.
 * This is the one place that decision is resolved — every domain's *read* Server
 * Action should call getContextMemberIds() instead of hardcoding
 * `eq('user_id', user.id)`, so a newly-added page automatically respects
 * whatever profile is active without its own switching logic.
 *
 * Mutations (create/update/delete) are a separate concern and stay hardcoded to
 * the signed-in user always — a household view is a joined *read*, never joint
 * editing (see docs/CONSOLIDATION_ANALYSIS.md section 6a). Attempting to edit
 * another member's row while viewing a household profile still hits the
 * existing owner-only checks in e.g. src/actions/debts.ts and fails.
 *
 * RLS remains the actual security boundary in all cases: including a household
 * member's user_id in the returned list doesn't force their rows to appear —
 * they only come back if that member has separately opted that data domain into
 * `share_*_with_household`. This module only decides *scope* (whose data are we
 * asking for); the database decides *authorization* (are we actually allowed to
 * see it).
 */

import { createClient } from '@/utils/supabase/server'

export interface ActiveContext {
    /** null = the user's own individual view. */
    householdId: string | null
    householdName: string | null
}

export async function getActiveContext(): Promise<ActiveContext> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { householdId: null, householdName: null }

    const { data: prefs } = await supabase
        .from('user_preferences')
        .select('active_household_id, households:active_household_id(name)')
        .eq('user_id', user.id)
        .maybeSingle()

    return {
        householdId: prefs?.active_household_id ?? null,
        householdName: (prefs?.households as any)?.name ?? null,
    }
}

/** The set of user_ids whose data belongs in the currently active profile's view. */
export async function getContextMemberIds(): Promise<string[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { householdId } = await getActiveContext()
    if (!householdId) return [user.id]

    const { data: members } = await supabase.from('household_members').select('user_id').eq('household_id', householdId)
    const ids = (members || []).map((m: any) => m.user_id)
    return ids.length > 0 ? ids : [user.id]
}

/** Switches the active profile. Verifies membership server-side — a client can't switch into a household it doesn't belong to. */
export async function switchActiveContext(householdId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    if (householdId) {
        const { data: membership } = await supabase
            .from('household_members')
            .select('household_id')
            .eq('household_id', householdId)
            .eq('user_id', user.id)
            .maybeSingle()
        if (!membership) return { success: false, error: 'Not a member of that household' }
    }

    const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, active_household_id: householdId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

    if (error) return { success: false, error: error.message }
    return { success: true }
}

/** For a profile-switcher UI: "Me" (null) plus every household the user belongs to. */
export async function listAvailableContexts(): Promise<{ id: string | null; name: string }[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: memberships } = await supabase
        .from('household_members')
        .select('households!inner(id, name)')
        .eq('user_id', user.id)

    return [
        { id: null, name: 'Me' },
        ...(memberships || []).map((m: any) => ({ id: m.households.id, name: m.households.name })),
    ]
}
