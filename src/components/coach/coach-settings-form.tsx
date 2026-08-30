'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { getAISettings, updateAISettings, type AISettings } from '@/actions/ai-settings'
import type { AIProviderKind } from '@/lib/ai/provider'

const DEFAULTS: AISettings = {
    aiProvider: 'self_hosted',
    aiCoachEnabled: true,
    selfHostedEndpointUrl: '',
    selfHostedModel: '',
    byoProvider: 'gemini',
    byoApiKeyConfigured: false,
    byoModel: '',
}

export function CoachSettingsForm() {
    const [settings, setSettings] = React.useState<AISettings>(DEFAULTS)
    const [byoApiKeyInput, setByoApiKeyInput] = React.useState('')
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [message, setMessage] = React.useState<string | null>(null)

    React.useEffect(() => {
        getAISettings().then((s) => {
            setSettings(s)
            setLoading(false)
        })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        setMessage(null)
        const result = await updateAISettings({
            ...settings,
            // Only send a new key if the user actually typed one — leaves the stored key untouched otherwise.
            byoApiKey: byoApiKeyInput || undefined,
        })
        setSaving(false)
        if (result.success) {
            setMessage('Saved.')
            setByoApiKeyInput('')
            getAISettings().then(setSettings)
        } else {
            setMessage(result.error ?? 'Failed to save.')
        }
    }

    if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Coach Settings</CardTitle>
                <CardDescription>
                    Choose where the coach&apos;s requests go. Neither option uses FinanceHub&apos;s own AI credentials —
                    a self-hosted endpoint or your own API key stays under your control.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="coach-enabled"
                        checked={settings.aiCoachEnabled}
                        onCheckedChange={(checked) => setSettings((s) => ({ ...s, aiCoachEnabled: !!checked }))}
                    />
                    <Label htmlFor="coach-enabled">Enable AI coach</Label>
                </div>

                <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                        value={settings.aiProvider}
                        onValueChange={(v) => setSettings((s) => ({ ...s, aiProvider: v as AIProviderKind }))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="self_hosted">Self-hosted endpoint</SelectItem>
                            <SelectItem value="byo_api_key">My own API key</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {settings.aiProvider === 'self_hosted' ? (
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                        <div className="space-y-2">
                            <Label htmlFor="endpoint-url">Endpoint URL</Label>
                            <Input
                                id="endpoint-url"
                                value={settings.selfHostedEndpointUrl}
                                onChange={(e) => setSettings((s) => ({ ...s, selfHostedEndpointUrl: e.target.value }))}
                                placeholder="http://localhost:11434/v1"
                            />
                            <p className="text-xs text-muted-foreground">
                                Any OpenAI-compatible endpoint — Ollama, LM Studio, vLLM, etc.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="self-hosted-model">Model</Label>
                            <Input
                                id="self-hosted-model"
                                value={settings.selfHostedModel}
                                onChange={(e) => setSettings((s) => ({ ...s, selfHostedModel: e.target.value }))}
                                placeholder="llama3.1"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                        <div className="space-y-2">
                            <Label>Provider</Label>
                            <Select
                                value={settings.byoProvider}
                                onValueChange={(v) => setSettings((s) => ({ ...s, byoProvider: v as AISettings['byoProvider'] }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">Gemini</SelectItem>
                                    <SelectItem value="openai">OpenAI (not yet supported)</SelectItem>
                                    <SelectItem value="anthropic">Anthropic (not yet supported)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="byo-api-key">API Key</Label>
                            <Input
                                id="byo-api-key"
                                type="password"
                                value={byoApiKeyInput}
                                onChange={(e) => setByoApiKeyInput(e.target.value)}
                                placeholder={settings.byoApiKeyConfigured ? 'Key on file — enter a new one to replace it' : 'Enter your API key'}
                            />
                            <p className="text-xs text-muted-foreground">
                                Stored encrypted (Supabase Vault) and never shown again after saving.
                                {settings.byoApiKeyConfigured && ' A key is currently on file.'}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="byo-model">Model</Label>
                            <Input
                                id="byo-model"
                                value={settings.byoModel}
                                onChange={(e) => setSettings((s) => ({ ...s, byoModel: e.target.value }))}
                                placeholder="gemini-3-flash-preview"
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                    {message && <span className="text-sm text-muted-foreground">{message}</span>}
                </div>
            </CardContent>
        </Card>
    )
}
