'use client'

import * as React from 'react'
import { validatePassword, type PasswordValidationResult } from '@/lib/password-validator'
import { Check, X } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
    password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const [validation, setValidation] = React.useState<PasswordValidationResult>({
        isValid: false,
        errors: [],
        strength: 'weak',
        score: 0
    })

    React.useEffect(() => {
        if (password) {
            setValidation(validatePassword(password))
        } else {
            setValidation({
                isValid: false,
                errors: [],
                strength: 'weak',
                score: 0
            })
        }
    }, [password])

    if (!password) return null

    const strengthColor = {
        weak: 'bg-red-500',
        medium: 'bg-yellow-500',
        strong: 'bg-green-500'
    }[validation.strength]

    const requirements = [
        { text: 'At least 12 characters', met: password.length >= 12 },
        { text: 'One uppercase letter', met: /[A-Z]/.test(password) },
        { text: 'One lowercase letter', met: /[a-z]/.test(password) },
        { text: 'One number', met: /\d/.test(password) },
        { text: 'One special character', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
    ]

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span className={`font-medium capitalize ${validation.strength === 'strong' ? 'text-green-600' :
                        validation.strength === 'medium' ? 'text-yellow-600' :
                            'text-red-600'
                        }`}>
                        {validation.strength}
                    </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full transition-all ${strengthColor}`}
                        style={{ width: `${validation.score}%` }}
                    />
                </div>
            </div>

            <div className="space-y-1">
                {requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        {req.met ? (
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                            <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={req.met ? 'text-foreground' : 'text-muted-foreground'}>
                            {req.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
