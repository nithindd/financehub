'use server'

import { createClient } from '@/utils/supabase/server'
import { getAISettings } from './ai-settings'
import { getDebtSummary } from './debts'
import { getAIProvider, type AIConnection, type CoachResponse } from '@/lib/ai/provider'

/**
 * Composes the read-only financial snapshot (debt summary today; expense summary
 * is a natural follow-up once ported) and routes to whichever provider the user
 * has configured. Never writes anything — see docs/CONSOLIDATION_ANALYSIS.md
 * section 5 for why v1 is advisory-only.
 */
export async function askCoach(message: string): Promise<CoachResponse> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { reply: 'Sign in to use the AI coach.', proposedActions: [] }

    const settings = await getAISettings()
    if (!settings.aiCoachEnabled) {
        return { reply: 'The AI coach is turned off. Enable it in Settings > AI Coach.', proposedActions: [] }
    }

    const debtSummary = await getDebtSummary()

    let connection: AIConnection
    if (settings.aiProvider === 'self_hosted') {
        connection = { endpointUrl: settings.selfHostedEndpointUrl, model: settings.selfHostedModel }
    } else {
        // The raw key never lives in settings — fetched from Vault only at the moment it's needed.
        const { data: apiKey, error } = await supabase.rpc('get_byo_api_key')
        if (error) return { reply: 'Could not retrieve your stored API key. Try re-entering it in Settings.', proposedActions: [] }
        connection = { provider: settings.byoProvider, apiKey: apiKey || '', model: settings.byoModel }
    }

    const provider = await getAIProvider(settings.aiProvider, connection)

    return provider.coachRespond({
        financialSnapshot: { debtSummary },
        message,
    })
}
