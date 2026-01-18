'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { checkUsernameAvailability } from '@/actions/auth'
import { Check, X, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

interface UsernameInputProps {
    value: string
    onChange: (value: string) => void
    error?: string
}

export function UsernameInput({ value, onChange, error }: UsernameInputProps) {
    const [checking, setChecking] = React.useState(false)
    const [available, setAvailable] = React.useState<boolean | null>(null)
    const [validationError, setValidationError] = React.useState<string>('')
    const debouncedUsername = useDebounce(value, 500)

    React.useEffect(() => {
        async function checkAvailability() {
            if (!debouncedUsername || debouncedUsername.length < 3) {
                setAvailable(null)
                setValidationError('')
                return
            }

            setChecking(true)
            const result = await checkUsernameAvailability(debouncedUsername)
            setChecking(false)
            setAvailable(result.available)
            setValidationError(result.error || '')
        }

        checkAvailability()
    }, [debouncedUsername])

    const showSuccess = available && !checking && value.length >= 3
    const showError = (available === false || validationError || error) && !checking

    return (
        <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
                <Input
                    id="username"
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="johndoe"
                    className={`pr-10 ${showError ? 'border-red-500' : showSuccess ? 'border-green-500' : ''}`}
                    aria-invalid={showError ? 'true' : undefined}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {showSuccess && <Check className="h-4 w-4 text-green-500" />}
                    {showError && <X className="h-4 w-4 text-red-500" />}
                </div>
            </div>
            {showError && (
                <p className="text-sm text-red-500">
                    {error || validationError || 'Username is already taken'}
                </p>
            )}
            {showSuccess && (
                <p className="text-sm text-green-600">
                    Username is available!
                </p>
            )}
            <p className="text-xs text-muted-foreground">
                3-30 characters, letters, numbers, underscores, and hyphens. Must start with a letter.
            </p>
        </div>
    )
}
