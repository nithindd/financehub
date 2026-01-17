import { createClient } from '@/utils/supabase/server'
import { getAccounts } from '@/actions/accounts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function CategoriesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const accounts = await getAccounts()

    // Group by type
    const grouped = {
        INCOME: accounts.filter(a => a.type === 'INCOME'),
        EXPENSE: accounts.filter(a => a.type === 'EXPENSE'),
        ASSET: accounts.filter(a => a.type === 'ASSET'),
        LIABILITY: accounts.filter(a => a.type === 'LIABILITY')
    }

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="ghost" size="sm" asChild className="mr-2">
                    <Link href="/profile">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold tracking-tight text-primary">Manage Categories</h1>
            </header>

            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="mx-auto grid w-full max-w-4xl gap-6">
                    {Object.entries(grouped).map(([type, accts]) => (
                        <Card key={type}>
                            <CardHeader>
                                <CardTitle>{type}</CardTitle>
                                <CardDescription>{accts.length} categories</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {accts.map(account => (
                                        <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <span className="font-medium">{account.name}</span>
                                            <div className="text-sm text-muted-foreground">
                                                {account.type}
                                            </div>
                                        </div>
                                    ))}
                                    {accts.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No {type.toLowerCase()} categories yet
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-10">
                            <Plus className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-4">
                                Category management coming soon
                            </p>
                            <p className="text-xs text-muted-foreground">
                                For now, categories are seeded automatically
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
