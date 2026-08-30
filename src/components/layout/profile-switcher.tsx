'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Users, ChevronsUpDown, Check, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getActiveContext, listAvailableContexts, switchActiveContext } from '@/actions/context'
import { cn } from '@/lib/utils'

interface ContextOption {
    id: string | null
    name: string
}

/**
 * Persistent, always-visible profile switcher (per product decision — not a
 * settings-page-only toggle, so which profile is active is never ambiguous).
 * Switching triggers a full router refresh so every Server Component on the
 * current page re-fetches with the new active profile
 * (src/lib/household-context.ts is what they all read from).
 */
export function ProfileSwitcher({ className }: { className?: string }) {
    const router = useRouter()
    const [options, setOptions] = React.useState<ContextOption[]>([{ id: null, name: 'Me' }])
    const [activeId, setActiveId] = React.useState<string | null>(null)
    const [pending, setPending] = React.useState(false)

    const load = React.useCallback(async () => {
        const [available, active] = await Promise.all([listAvailableContexts(), getActiveContext()])
        setOptions(available.length > 0 ? available : [{ id: null, name: 'Me' }])
        setActiveId(active.householdId)
    }, [])

    React.useEffect(() => {
        load()
    }, [load])

    // Nothing to switch between yet — don't show a dropdown for a single "Me" option.
    if (options.length <= 1) return null

    const activeOption = options.find((o) => o.id === activeId) ?? options[0]

    const handleSelect = async (option: ContextOption) => {
        if (option.id === activeId || pending) return
        setPending(true)
        const result = await switchActiveContext(option.id)
        setPending(false)
        if (result.success) {
            setActiveId(option.id)
            router.refresh()
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    className={cn('gap-2 justify-between font-normal', className)}
                >
                    <span className="flex items-center gap-2 truncate">
                        {activeOption.id === null ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                        <span className="truncate">{activeOption.name}</span>
                    </span>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Viewing as</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {options.map((option) => (
                    <DropdownMenuItem key={option.id ?? 'me'} onClick={() => handleSelect(option)} className="gap-2">
                        {option.id === null ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                        <span className="flex-1 truncate">{option.name}</span>
                        {option.id === activeId && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
