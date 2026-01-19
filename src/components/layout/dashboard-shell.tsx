'use client'

import * as React from "react"
import { ShieldCheck } from "lucide-react"
import { Sidebar } from "./sidebar"
import { MobileNav } from "./mobile-nav"

interface DashboardShellProps {
    children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/20 md:flex-row">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 mb-16 md:mb-0">
                {/* Mobile Header: Logo & Branding + Help Link */}
                <header className="md:hidden flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-40 h-16">
                    <div className="flex items-center gap-2 font-semibold text-primary">
                        <ShieldCheck className="h-6 w-6" />
                        <span className="">FinanceHub</span>
                    </div>
                    <a href="/manual"> {/* Using a tag to ensure navigation even if client router fails, or just simplified */}
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                        </button>
                    </a>
                </header>
                <main className="flex-1 p-4 sm:px-6 sm:py-8 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
            <MobileNav />
        </div>
    )
}
