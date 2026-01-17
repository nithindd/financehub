'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { updateUserPreferences } from '@/actions/profile'

const timezones = Intl.supportedValuesOf('timeZone')

interface TimezoneFormProps {
    initialTimezone: string
}

export function TimezoneForm({ initialTimezone }: TimezoneFormProps) {
    const [timezone, setTimezone] = React.useState(initialTimezone)
    const [isSaving, setIsSaving] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        await updateUserPreferences(timezone)
        setIsSaving(false)
        alert('Timezone updated successfully!')
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
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
                <p className="text-sm text-muted-foreground">
                    Used for transaction dates and timestamps
                </p>
            </div>
            <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
        </form>
    )
}
