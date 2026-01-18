/**
 * Password validation utility
 * Enforces strong password requirements for security
 */

export interface PasswordValidationResult {
    isValid: boolean
    errors: string[]
    strength: 'weak' | 'medium' | 'strong'
    score: number // 0-100
}

export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = []
    let score = 0

    // Minimum length check (12 characters)
    if (password.length < 12) {
        errors.push('Password must be at least 12 characters long')
    } else {
        score += 25
        if (password.length >= 16) score += 10
    }

    // Uppercase letter check
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter')
    } else {
        score += 20
    }

    // Lowercase letter check
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter')
    } else {
        score += 20
    }

    // Number check
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number')
    } else {
        score += 15
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)')
    } else {
        score += 20
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong'
    if (score >= 80) {
        strength = 'strong'
    } else if (score >= 50) {
        strength = 'medium'
    } else {
        strength = 'weak'
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength,
        score
    }
}

/**
 * Check if username meets requirements
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || username.trim().length === 0) {
        return { isValid: false, error: 'Username is required' }
    }

    if (username.length < 3) {
        return { isValid: false, error: 'Username must be at least 3 characters long' }
    }

    if (username.length > 30) {
        return { isValid: false, error: 'Username must be less than 30 characters long' }
    }

    // Only allow alphanumeric characters, underscores, and hyphens
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' }
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(username)) {
        return { isValid: false, error: 'Username must start with a letter' }
    }

    return { isValid: true }
}
