import type { AIProvider, CoachContext, CoachResponse, SelfHostedConnection } from './provider'

/**
 * Calls a user-owned, self-hosted endpoint (Ollama, LM Studio, vLLM, etc.) using
 * the widely-supported OpenAI-compatible `/chat/completions` shape. No app-level
 * credentials involved — the endpoint is the user's own infrastructure.
 */
export function createSelfHostedProvider(connection: SelfHostedConnection): AIProvider {
    return {
        kind: 'self_hosted',

        async coachRespond(context: CoachContext): Promise<CoachResponse> {
            if (!connection.endpointUrl) {
                return {
                    reply: 'No self-hosted AI endpoint is configured yet. Add one in Settings > AI Coach.',
                    proposedActions: [],
                }
            }

            const systemPrompt =
                'You are a financial coach. You can only observe the data you are given and comment on it. ' +
                'You cannot create, edit, or delete anything. Describe any suggestion in plain language — ' +
                'do not assume it has already been applied.'

            const url = connection.endpointUrl.replace(/\/+$/, '') + '/chat/completions'

            let response: Response
            try {
                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: connection.model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: `Financial snapshot: ${JSON.stringify(context.financialSnapshot)}\n\nQuestion: ${context.message}` },
                        ],
                    }),
                })
            } catch (err) {
                return {
                    reply: `Could not reach the self-hosted AI endpoint (${connection.endpointUrl}). Is it running and reachable from the server?`,
                    proposedActions: [],
                }
            }

            if (!response.ok) {
                return {
                    reply: `Self-hosted AI endpoint returned an error (HTTP ${response.status}).`,
                    proposedActions: [],
                }
            }

            const data = await response.json()
            const reply = data?.choices?.[0]?.message?.content ?? 'The self-hosted endpoint returned an unexpected response shape.'

            // v1: no structured action-proposal extraction yet — same follow-up as byo-provider.ts.
            return { reply, proposedActions: [] }
        },
    }
}
