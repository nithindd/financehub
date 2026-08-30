'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AIProviderKind } from '@/lib/ai/provider'

export interface AISettings {
    aiProvider: AIProviderKind
    aiCoachEnabled: boolean
    selfHostedEndpointUrl: string
    selfHostedModel: string
    byoProvider: 'gemini' | 'openai' | 'anthropic'
    /** Whether a key is currently stored in Vault. The raw key itself is never returned to the client. */
    byoApiKeyConfigured: boolean
    byoModel: string
}

const DEFAULTS: AISettings = {
    aiProvider: 'self_hosted',
    aiCoachEnabled: true,
    selfHostedEndpointUrl: '',
    selfHostedModel: '',
    byoProvider: 'gemini',
    byoApiKeyConfigured: false,
    byoModel: '',
}

export async function getAISettings(): Promise<AISettings> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return DEFAULTS

    const [{ data: prefs }, { data: conn }] = await Promise.all([
        supabase.from('user_preferences').select('ai_provider, ai_coach_enabled').eq('user_id', user.id).maybeSingle(),
        // byo_api_key_secret_id is only read to check presence — never sent further than "configured: true/false"
        supabase.from('ai_connections').select('self_hosted_endpoint_url, self_hosted_model, byo_provider, byo_api_key_secret_id, byo_model').eq('user_id', user.id).maybeSingle(),
    ])

    return {
        aiProvider: (prefs?.ai_provider as AIProviderKind) || DEFAULTS.aiProvider,
        aiCoachEnabled: prefs?.ai_coach_enabled ?? DEFAULTS.aiCoachEnabled,
        selfHostedEndpointUrl: conn?.self_hosted_endpoint_url || '',
        selfHostedModel: conn?.self_hosted_model || '',
        byoProvider: conn?.byo_provider || DEFAULTS.byoProvider,
        byoApiKeyConfigured: !!conn?.byo_api_key_secret_id,
        byoModel: conn?.byo_model || '',
    }
}

export interface UpdateAISettingsInput {
    aiProvider: AIProviderKind
    aiCoachEnabled: boolean
    selfHostedEndpointUrl: string
    selfHostedModel: string
    byoProvider: 'gemini' | 'openai' | 'anthropic'
    /** Only pass this when the user is setting/rotating their key; omit to leave the stored key unchanged. */
    byoApiKey?: string
    byoModel: string
}

export async function updateAISettings(input: UpdateAISettingsInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert({
            user_id: user.id,
            ai_provider: input.aiProvider,
            ai_coach_enabled: input.aiCoachEnabled,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

    if (prefError) return { error: prefError.message }

    const { error: connError } = await supabase
        .from('ai_connections')
        .upsert({
            user_id: user.id,
            self_hosted_endpoint_url: input.selfHostedEndpointUrl || null,
            self_hosted_model: input.selfHostedModel || null,
            byo_provider: input.byoProvider,
            byo_model: input.byoModel || null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

    if (connError) return { error: connError.message }

    // Only touches Vault when the user actually typed a new key.
    if (input.byoApiKey) {
        const { error: vaultError } = await supabase.rpc('set_byo_api_key', { p_api_key: input.byoApiKey })
        if (vaultError) return { error: vaultError.message }
    }

    revalidatePath('/settings')
    return { success: true }
}
