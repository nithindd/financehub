/**
 * One interface for anything AI-backed in the app: invoice/statement extraction
 * (already implemented against Gemini with the app's own key, see
 * src/actions/ocr.ts) and the new coach. The coach never uses the app's shared
 * key — per product decision, "local-first AI" means the request goes to
 * infrastructure the *user* controls:
 *
 * - `self_hosted`: an OpenAI-compatible endpoint the user runs themselves
 *   (Ollama, LM Studio, vLLM, etc.) — see self-hosted-provider.ts.
 * - `byo_api_key`: a hosted provider (Gemini today), called with a key the user
 *   supplies and owns — see byo-provider.ts.
 *
 * Selected per-user via `user_preferences.ai_provider`, configured via the
 * `ai_connections` table (migrations/017, 018).
 *
 * v1 scope is intentionally read-only/advisory: `coachRespond` takes a snapshot of
 * already-computed data (ledger summaries, debt projections) and returns text plus
 * optional *proposed* actions for the user to review — it never calls a mutating
 * Server Action itself. See docs/CONSOLIDATION_ANALYSIS.md section 5.
 */

export type AIProviderKind = 'self_hosted' | 'byo_api_key'

export interface SelfHostedConnection {
    endpointUrl: string
    model: string
}

export interface ByoApiKeyConnection {
    provider: 'gemini' | 'openai' | 'anthropic'
    apiKey: string
    model: string
}

export type AIConnection = SelfHostedConnection | ByoApiKeyConnection

export interface CoachContext {
    /** Plain-language or structured summary of the user's finances the coach can reason about. */
    financialSnapshot: Record<string, unknown>
    /** The user's message / question. */
    message: string
}

export interface ProposedAction {
    kind: string // e.g. 'redirect_payment', 'flag_anomaly' — intentionally open-ended in v1
    description: string
    details: Record<string, unknown>
}

export interface CoachResponse {
    reply: string
    proposedActions: ProposedAction[]
}

export interface AIProvider {
    kind: AIProviderKind
    coachRespond(context: CoachContext): Promise<CoachResponse>
}

export async function getAIProvider(kind: AIProviderKind, connection: AIConnection): Promise<AIProvider> {
    if (kind === 'self_hosted') {
        const { createSelfHostedProvider } = await import('./self-hosted-provider')
        return createSelfHostedProvider(connection as SelfHostedConnection)
    }
    const { createByoApiKeyProvider } = await import('./byo-provider')
    return createByoApiKeyProvider(connection as ByoApiKeyConnection)
}
