import { createClient } from '@/utils/supabase/server'
import { getUserPreferences } from '@/actions/profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TimezoneForm } from '@/components/profile/timezone-form'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { HelpCircle } from 'lucide-react'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8">Please log in to view your profile.</div>
    }

    const preferences = await getUserPreferences()

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <Header title="Profile Settings" showBack={true} />

            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="mx-auto grid w-full max-w-2xl gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                            <CardDescription>Your account details from Google OAuth</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm text-muted-foreground">Email</Label>
                                <p className="text-lg font-medium">{user.email}</p>
                            </div>
                            <div>
                                <Label className="text-sm text-muted-foreground">User ID</Label>
                                <p className="text-sm font-mono text-muted-foreground">{user.id}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Preferences</CardTitle>
                            <CardDescription>Customize your experience</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TimezoneForm initialTimezone={preferences?.timezone || 'UTC'} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>Manage categories and vendor mappings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href="/settings/categories">
                                <Button variant="outline" className="w-full justify-start">
                                    Manage Categories
                                </Button>
                            </Link>
                            <Link href="/settings/vendors">
                                <Button variant="outline" className="w-full justify-start">
                                    Vendor Mappings
                                </Button>
                            </Link>

                            <div className="pt-4 border-t mt-4">
                                <Link href="/manual">
                                    <Button variant="secondary" className="w-full justify-start gap-2">
                                        <HelpCircle className="h-4 w-4" />
                                        User Manual & Help
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
