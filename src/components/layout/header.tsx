'use client'

import * as React from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, ArrowLeft } from 'lucide-react'
import { signOut } from '@/actions/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

interface HeaderProps {
    title: string
    showBack?: boolean
    backHref?: string
}

export function Header({ title, showBack = false, backHref = '/' }: HeaderProps) {
    const [user, setUser] = React.useState<any>(null)
    const supabase = createClient()

    React.useEffect(() => {
        const fetchUser = async () => {
            const { getUserProfile } = await import('@/actions/profile')
            const result = await getUserProfile()
            if ('profile' in result) {
                setUser(result.profile)
            } else {
                const { data: { user: authUser } } = await supabase.auth.getUser()
                setUser(authUser)
            }
        }
        fetchUser()
    }, [supabase.auth])

    if (!user) return null

    // Get user initials for avatar fallback
    const userInitial = user.email?.[0]?.toUpperCase() || 'U'

    return (
        <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center px-4 sm:px-8">
                {showBack && (
                    <Button variant="ghost" size="sm" asChild className="mr-4">
                        <Link href={backHref}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                    </Button>
                )}

                <Link href="/" className="flex items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight text-primary">{title}</h1>
                </Link>

                <div className="ml-auto flex items-center gap-2 sm:gap-4">
                    <Link href="/profile" title={user.email || ''}>
                        <Avatar className="h-9 w-9 border transition-colors hover:border-primary">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary">{userInitial}</AvatarFallback>
                        </Avatar>
                    </Link>

                    <form action={async () => {
                        await signOut()
                    }}>
                        <Button variant="ghost" size="sm" type="submit" className="gap-2 text-muted-foreground hover:text-destructive px-2 sm:px-3">
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </form>
                </div>
            </div>
        </header>
    )
}
