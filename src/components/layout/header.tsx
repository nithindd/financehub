import { createClient } from '@/utils/supabase/server'
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

export async function Header({ title, showBack = false, backHref = '/' }: HeaderProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get user initials for avatar fallback
    const userInitial = user.email?.[0]?.toUpperCase() || 'U'

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            {showBack && (
                <Button variant="ghost" size="sm" asChild className="mr-2">
                    <Link href={backHref}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Link>
                </Button>
            )}
            <h1 className="text-xl font-semibold tracking-tight text-primary">{title}</h1>
            <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-3">
                    <Link href="/profile" title={user.email || ''}>
                        <Avatar className="h-9 w-9 border transition-colors hover:border-primary">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary">{userInitial}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <form action={signOut}>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </form>
                </div>
            </div>
        </header>
    )
}
