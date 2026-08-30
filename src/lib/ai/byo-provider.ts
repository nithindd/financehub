import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProvider, ByoApiKeyConnection, CoachContext, CoachResponse } from './provider'

const GEMINI_MODEL_FALLBACK = 'gemini-3-flash-preview' // same default model as src/actions/ocr.ts

/**
 * Calls a hosted provider using a key the user supplies and owns — never the
 * app's own GOOGLE_API_KEY (that stays scoped to the existing OCR feature).
 * Only Gemini is wired up today; openai/anthropic are accepted values in the
 * schema (migrations/018) but not yet implemented here.
 */
export function createByoApiKeyProvider(connection: ByoApiKeyConnection): AIProvider {
    return {
        kind: 'byo_api_key',

        async coachRespond(context: CoachContext): Promise<CoachResponse> {
            if (!connection.apiKey) {
                return {
                    reply: 'No API key is configured yet. Add your own key in Settings > AI Coach.',
                    proposedActions: [],
                }
            }

            if (connection.provider !== 'gemini') {
                return {
                    reply: `${connection.provider} is not yet supported for the coach — only Gemini is implemented so far.`,
                    proposedActions: [],
                }
            }

            const genAI = new GoogleGenerativeAI(connection.apiKey)
            const model = genAI.getGenerativeModel({ model: connection.model || GEMINI_MODEL_FALLBACK })

            const prompt = [
                'You are a financial coach. You can only observe the data below and comment on it.',
                'You cannot create, edit, or delete anything. If you have a suggestion the user could act on,',
                'describe it in plain language in your reply — do not assume it has been applied.',
                '',
                `Financial snapshot: ${JSON.stringify(context.financialSnapshot)}`,
                `User question: ${context.message}`,
            ].join('\n')

            try {
                const result = await model.generateContent(prompt)
                // v1: no structured action-proposal extraction yet — reply text only for now.
                return { reply: result.response.text(), proposedActions: [] }
            } catch (err) {
                return { reply: 'The AI provider returned an error. Check that your API key is valid.', proposedActions: [] }
            }
        },
    }
}
