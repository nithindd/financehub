'use client'

import * as React from "react"
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
                {/* 
                   Mobile Header could go here if needed, 
                   but we are using Bottom Nav. 
                   We might want a simple top bar for Logo/Profile on mobile though.
                */}
                <main className="flex-1 p-4 sm:px-6 sm:py-8 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
            <MobileNav />
        </div>
    )
}
