'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldCheck, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { resetPassword } from '@/actions/auth'

export default function ForgotPasswordPage() {
    const [email, setEmail] = React.useState('')
    const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = React.useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')
        setMessage('')

        const result = await resetPassword(email)

        if (result.error) {
            setStatus('error')
            setMessage(result.error)
        } else {
            setStatus('success')
            setMessage(result.message || 'Password reset email sent! Check your inbox.')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-primary">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email and we'll send you a link to reset your password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {status === 'success' ? (
                        <div className="space-y-4">
                            <Alert className="border-green-500 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-600">Email Sent!</AlertTitle>
                                <AlertDescription className="text-green-600">
                                    {message}
                                </AlertDescription>
                            </Alert>
                            <Link href="/signin" className="block">
                                <Button variant="outline" className="w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Sign In
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {status === 'error' && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    required
                                    disabled={status === 'loading'}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={status === 'loading'}>
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>

                            <Link href="/signin" className="block">
                                <Button variant="ghost" className="w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Sign In
                                </Button>
                            </Link>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
