'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, BarChart3, Plus, FileText, Settings, Camera, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerClose,
    DrawerFooter
} from "@/components/ui/drawer"
import { TransactionDialog } from "@/components/transaction-dialog"
import { StatementUploader } from "@/components/statement-uploader"
import * as React from "react"
import { createClient } from "@/utils/supabase/client"

export function MobileNav() {
    const pathname = usePathname()
    const [open, setOpen] = React.useState(false)
    const [activeSheet, setActiveSheet] = React.useState<'scan' | 'manual' | 'upload' | null>(null)

    // Helper to determine active state
    const isActive = (path: string) => pathname === path

    const handleActionClick = (action: 'scan' | 'manual' | 'upload') => {
        setOpen(false)
        // Small delay to allow drawer to close smoothly before opening dialog
        setTimeout(() => {
            setActiveSheet(action)
        }, 150)
    }

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden pb-safe">
                <div className="flex items-center justify-around h-16 px-2">
                    <Link
                        href="/"
                        className={cn(
                            "flex flex-col items-center justify-center w-16 h-full gap-1 text-[10px] font-medium transition-colors",
                            isActive("/") ? "text-primary" : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        <span>Home</span>
                    </Link>

                    <Link
                        href="/analytics"
                        className={cn(
                            "flex flex-col items-center justify-center w-16 h-full gap-1 text-[10px] font-medium transition-colors",
                            isActive("/analytics") ? "text-primary" : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        <BarChart3 className="h-5 w-5" />
                        <span>Analytics</span>
                    </Link>

                    {/* Central Action Button */}
                    <div className="relative -top-5">
                        <Drawer open={open} onOpenChange={setOpen}>
                            <DrawerTrigger asChild>
                                <Button
                                    size="icon"
                                    className="h-14 w-14 rounded-full shadow-lg border-4 border-background"
                                >
                                    <Plus className="h-6 w-6" />
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent>
                                <DrawerHeader>
                                    <DrawerTitle>Quick Actions</DrawerTitle>
                                    <DrawerDescription>Add a new transaction or upload evidence.</DrawerDescription>
                                </DrawerHeader>
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        className="h-24 flex-col gap-2 bg-muted/50 hover:bg-muted font-normal"
                                        onClick={() => handleActionClick('scan')}
                                    >
                                        <Camera className="h-8 w-8 text-primary" />
                                        <span>Scan Invoice</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-24 flex-col gap-2 bg-muted/50 hover:bg-muted font-normal"
                                        onClick={() => handleActionClick('manual')}
                                    >
                                        <Receipt className="h-8 w-8 text-primary" />
                                        <span>Manual Entry</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-24 flex-col gap-2 bg-muted/50 hover:bg-muted font-normal w-full col-span-2"
                                        onClick={() => handleActionClick('upload')}
                                    >
                                        <FileText className="h-8 w-8 text-primary" />
                                        <span>Upload Statement (CSV/PDF)</span>
                                    </Button>

                                    <div className="col-span-2 pt-2 border-t mt-2">
                                        <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleSignOut}>
                                            Sign Out
                                        </Button>
                                    </div>
                                </div>
                                <DrawerFooter>
                                    <DrawerClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DrawerClose>
                                </DrawerFooter>
                            </DrawerContent>
                        </Drawer>
                    </div>

                    <Link
                        href="/reports"
                        className={cn(
                            "flex flex-col items-center justify-center w-16 h-full gap-1 text-[10px] font-medium transition-colors",
                            isActive("/reports") ? "text-primary" : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        <FileText className="h-5 w-5" />
                        <span>Reports</span>
                    </Link>

                    <Link
                        href="/profile"
                        className={cn(
                            "flex flex-col items-center justify-center w-16 h-full gap-1 text-[10px] font-medium transition-colors",
                            isActive("/profile") ? "text-primary" : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                    </Link>
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
        </>
    )
}
