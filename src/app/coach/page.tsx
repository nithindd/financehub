import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CoachChat } from '@/components/coach/coach-chat'
import { CoachSettingsForm } from '@/components/coach/coach-settings-form'

export default async function CoachPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/signin')
    }

    return (
        <DashboardShell>
            <div className="space-y-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">AI Coach</h1>
                    <p className="text-muted-foreground">
                        A read-only financial coach — it can see your debt summary and offer advice, never make changes on its own.
                    </p>
                </div>

                <Tabs defaultValue="chat" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="chat">Chat</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="chat">
                        <CoachChat />
                    </TabsContent>
                    <TabsContent value="settings">
                        <CoachSettingsForm />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    )
}
