'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, CreditCard, BarChart3, Settings, LogOut, ShieldCheck, FileText, Plus, Camera, Receipt, Upload, HelpCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { TransactionDialog } from "@/components/transaction-dialog"
import { StatementUploader } from "@/components/statement-uploader"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Sidebar() {
    const pathname = usePathname()
    const [user, setUser] = useState<User | null>(null)
    const [activeSheet, setActiveSheet] = useState<'scan' | 'manual' | 'upload' | null>(null)

    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()
    }, [])

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    const navItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        // "Transactions" replaced by "New Transaction" action
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
        { name: "Reports", href: "/reports", icon: FileText },
        { name: "Settings", href: "/profile", icon: Settings },
        { name: "Help & Manual", href: "/manual", icon: HelpCircle },
    ]

    return (
        <div className="hidden border-r bg-muted/40 md:block md:w-64 lg:w-72 h-screen sticky top-0">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 bg-background/95 backdrop-blur">
                    <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                        <ShieldCheck className="h-6 w-6" />
                        <span className="">FinanceHub</span>
                    </Link>
                </div>

                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
                        <Link
                            href="/"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                pathname === '/' ? "bg-muted text-primary" : "text-muted-foreground"
                            )}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>

                        {/* New Transaction Dropdown Trigger */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary w-full text-left text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <Plus className="h-4 w-4" />
                                    New Transaction
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                <DropdownMenuLabel>Add Transaction</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setActiveSheet('scan')}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    <span>Scan Invoice</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setActiveSheet('manual')}>
                                    <Receipt className="mr-2 h-4 w-4" />
                                    <span>Manual Entry</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setActiveSheet('upload')}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    <span>Upload Statement</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Link
                            href="/analytics"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                pathname === '/analytics' ? "bg-muted text-primary" : "text-muted-foreground"
                            )}
                        >
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </Link>

                        <Link
                            href="/reports"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                pathname === '/reports' ? "bg-muted text-primary" : "text-muted-foreground"
                            )}
                        >
                            <FileText className="h-4 w-4" />
                            Reports
                        </Link>

                        <Link
                            href="/profile"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                pathname === '/profile' ? "bg-muted text-primary" : "text-muted-foreground"
                            )}
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>

                        <Link
                            href="/manual"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                pathname === '/manual' ? "bg-muted text-primary" : "text-muted-foreground"
                            )}
                        >
                            <HelpCircle className="h-4 w-4" />
                            Help & Manual
                        </Link>
                    </nav>
                </div>

                <div className="mt-auto border-t p-4">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/profile" className="flex items-center gap-2 flex-1 overflow-hidden hover:opacity-80 transition-opacity">
                            <Avatar className="h-9 w-9 border">
                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-0.5 text-xs">
                                <div className="font-medium truncate text-foreground">{user?.user_metadata?.full_name || 'User'}</div>
                                <div className="text-muted-foreground truncate">{user?.email}</div>
                            </div>
                        </Link>
                    </div>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />
                        Log out
                    </Button>
                </div>
            </div>

            {/* Hoisted Dialogs controlled by state */}
            <TransactionDialog
                defaultOpenOcr={true}
                open={activeSheet === 'scan'}
                onOpenChange={(open) => !open && setActiveSheet(null)}
            >
                <span className="hidden"></span>
            </TransactionDialog>

            <TransactionDialog
                open={activeSheet === 'manual'}
                onOpenChange={(open) => !open && setActiveSheet(null)}
            >
                <span className="hidden"></span>
            </TransactionDialog>

            <StatementUploader
                open={activeSheet === 'upload'}
                onOpenChange={(open) => !open && setActiveSheet(null)}
            >
                <span className="hidden"></span>
            </StatementUploader>
        </div>
    )
}
