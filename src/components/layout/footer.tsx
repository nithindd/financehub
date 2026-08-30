import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export function Footer() {
    return (
        <footer className="border-t bg-background">
            <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    <div className="space-y-8">
                        <div className="flex items-center gap-2 font-bold text-xl text-primary">
                            <ShieldCheck className="h-6 w-6" />
                            <span>FinanceHub</span>
                        </div>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            Smart double-entry accounting powered by AI. Extract data from receipts and manage your finances with ease.
                        </p>
                    </div>
                    <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Product</h3>
                                <ul role="list" className="mt-4 space-y-4">
                                    <li>
                                        <Link href="/#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                            Features
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/manual" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                            User Manual
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0">
                                <h3 className="text-sm font-semibold text-foreground">Account</h3>
                                <ul role="list" className="mt-4 space-y-4">
                                    <li>
                                        <Link href="/signin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                            Sign In
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/signup" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                            Sign Up
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                            Profile Settings
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Legal</h3>
                                <ul role="list" className="mt-4 space-y-4">
                                    <li>
                                        <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                            Privacy Policy
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                            Terms of Service
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-12 border-t pt-8">
                    <p className="text-xs text-muted-foreground text-center">
                        &copy; {new Date().getFullYear()} FinanceHub Inc. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
