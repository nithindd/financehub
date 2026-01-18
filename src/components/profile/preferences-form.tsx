'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { updateUserPreferences } from '@/actions/profile'

const timezones = Intl.supportedValuesOf('timeZone')

const currencies = [
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' },
    { code: 'INR', name: 'Indian Rupee (₹)' },
]

const locales = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
]

interface PreferencesFormProps {
    initialTimezone: string
    initialCurrency: string
    initialLocale: string
}

export function PreferencesForm({ initialTimezone, initialCurrency, initialLocale }: PreferencesFormProps) {
    const [timezone, setTimezone] = React.useState(initialTimezone)
    const [currency, setCurrency] = React.useState(initialCurrency)
    const [locale, setLocale] = React.useState(initialLocale)
    const [isSaving, setIsSaving] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        const result = await updateUserPreferences({ timezone, currency, locale })
        setIsSaving(false)
        if (result.error) {
            alert('Failed to update preferences: ' + result.error)
        } else {
            alert('Preferences updated successfully!')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger id="currency">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {currencies.map(c => (
                                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Your primary currency for reporting.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="locale">Formatting Locale</Label>
                    <Select value={locale} onValueChange={setLocale}>
                        <SelectTrigger id="locale">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {locales.map(l => (
                                <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        How dates and numbers verify appear (e.g., 1,000.00 vs 1.000,00).
                    </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger id="timezone">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {timezones.map(tz => (
                                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Used for transaction timestamps.
                    </p>
                </div>
            </div>

            <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
        </form>
    )
}
