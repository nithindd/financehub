'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, User, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { askCoach } from '@/actions/coach'

interface ChatMessage {
    role: 'user' | 'coach'
    text: string
}

export function CoachChat() {
    const [messages, setMessages] = React.useState<ChatMessage[]>([])
    const [input, setInput] = React.useState('')
    const [sending, setSending] = React.useState(false)

    const handleSend = async () => {
        const message = input.trim()
        if (!message || sending) return

        setMessages((prev) => [...prev, { role: 'user', text: message }])
        setInput('')
        setSending(true)

        const response = await askCoach(message)

        setMessages((prev) => [...prev, { role: 'coach', text: response.reply }])
        setSending(false)
    }

    return (
        <Card className="flex flex-col h-[600px]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Ask the Coach
                </CardTitle>
                <CardDescription>
                    Read-only and advisory — the coach can see your debt summary and comment on it, but it can
                    never create, edit, or delete anything on its own.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {messages.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Try asking: &quot;How can I pay off my debt faster?&quot; or &quot;What&apos;s my biggest interest cost right now?&quot;
                        </p>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={cn('flex gap-2', m.role === 'user' && 'justify-end')}>
                            {m.role === 'coach' && (
                                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    'rounded-lg px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap',
                                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                )}
                            >
                                {m.text}
                            </div>
                            {m.role === 'user' && (
                                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                                    <User className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    ))}
                    {sending && <p className="text-sm text-muted-foreground">Thinking...</p>}
                </div>

                <div className="flex gap-2 items-end border-t pt-4">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder="Ask about your debts..."
                        rows={2}
                        className="flex-1 resize-none"
                    />
                    <Button size="icon" onClick={handleSend} disabled={sending || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
