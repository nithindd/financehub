'use server'

/**
 * Thin client-callable wrappers around src/lib/household-context.ts (which other
 * Server Actions import directly for their own use). This file exists only so a
 * Client Component (the profile-switcher header control) has something it's
 * allowed to call — matching this codebase's convention of keeping 'use server'
 * entry points in src/actions/ and plain server-side helpers in src/lib/.
 */

import * as householdContext from '@/lib/household-context'
import type { ActiveContext } from '@/lib/household-context'

export async function getActiveContext(): Promise<ActiveContext> {
    return householdContext.getActiveContext()
}

export async function listAvailableContexts(): Promise<{ id: string | null; name: string }[]> {
    return householdContext.listAvailableContexts()
}

export async function switchActiveContext(householdId: string | null) {
    return householdContext.switchActiveContext(householdId)
}
