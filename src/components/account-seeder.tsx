'use client'

import { useEffect } from 'react'
import { seedDefaultAccounts } from '@/actions/accounts'

export function AccountSeeder() {
    useEffect(() => {
        // Attempt to seed defaults on mount. 
        // It is safe because server action checks for existence.
        seedDefaultAccounts()
    }, [])

    return null
}
