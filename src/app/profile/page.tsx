'use client'

import * as React from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { User, Lock, Shield, AlertCircle, CheckCircle2, Loader2, Settings, HelpCircle } from 'lucide-react'
import { getUserProfile, updateProfile, enable2FA, verify2FA, disable2FA, get2FAFactors } from '@/actions/profile'
import { updatePassword } from '@/actions/auth'
import { PasswordStrengthIndicator } from '@/components/password-strength-indicator'
import { UsernameInput } from '@/components/username-input'
import { TimezoneForm } from '@/components/profile/timezone-form'
import QRCode from 'qrcode'

export default function ProfilePage() {
    const [profile, setProfile] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [updateStatus, setUpdateStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null)

    // Personal Info Form
    const [personalInfo, setPersonalInfo] = React.useState({
        firstName: '',
        lastName: '',
        username: '',
        email: ''
    })

    // Security Form
    const [currentPassword, setCurrentPassword] = React.useState('')
    const [newPassword, setNewPassword] = React.useState('')
    const [confirmPassword, setConfirmPassword] = React.useState('')

    // 2FA State
    const [twoFAEnabled, setTwoFAEnabled] = React.useState(false)
    const [showSetup2FA, setShowSetup2FA] = React.useState(false)
    const [qrCodeUrl, setQrCodeUrl] = React.useState('')
    const [twoFASecret, setTwoFASecret] = React.useState('')
    const [twoFAFactorId, setTwoFAFactorId] = React.useState('')
    const [verificationCode, setVerificationCode] = React.useState('')
    const [currentFactorId, setCurrentFactorId] = React.useState('')

    React.useEffect(() => {
        loadProfile()
    }, [])

    async function loadProfile() {
        setLoading(true)
        const result = await getUserProfile()

        if (result.error) {
            setUpdateStatus({ type: 'error', message: result.error })
            setLoading(false)
            return
        }

        if (result.profile) {
            setProfile(result.profile)
            setPersonalInfo({
                firstName: result.profile.first_name || '',
                lastName: result.profile.last_name || '',
                username: result.profile.username || '',
                email: result.profile.email || ''
            })
        }

        // Check 2FA status
        const factorsResult = await get2FAFactors()
        if (factorsResult.factors && factorsResult.factors.length > 0) {
            setTwoFAEnabled(true)
            setCurrentFactorId(factorsResult.factors[0].id)
        }

        setLoading(false)
    }

    async function handleUpdateProfile() {
        setUpdateStatus(null)
        const result = await updateProfile({
            firstName: personalInfo.firstName,
            lastName: personalInfo.lastName,
            username: personalInfo.username
        })

        if (result.error) {
            setUpdateStatus({ type: 'error', message: result.error })
        } else {
            setUpdateStatus({ type: 'success', message: result.message || 'Profile updated successfully' })
            loadProfile()
        }
    }

    async function handleChangePassword() {
        setUpdateStatus(null)

        if (newPassword !== confirmPassword) {
            setUpdateStatus({ type: 'error', message: 'New passwords do not match' })
            return
        }

        const result = await updatePassword(newPassword)

        if (result.error) {
            setUpdateStatus({ type: 'error', message: result.error })
        } else {
            setUpdateStatus({ type: 'success', message: result.message || 'Password updated successfully' })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        }
    }

    async function handleEnable2FA() {
        setUpdateStatus(null)
        const result = await enable2FA()

        if (result.error) {
            setUpdateStatus({ type: 'error', message: result.error })
            return
        }

        if (!result.id || !result.secret || !result.uri) {
            setUpdateStatus({ type: 'error', message: 'Failed to enable 2FA' })
            return
        }

        setTwoFAFactorId(result.id)
        setTwoFASecret(result.secret)

        // Generate QR code
        try {
            const url = await QRCode.toDataURL(result.uri)
            setQrCodeUrl(url)
            setShowSetup2FA(true)
        } catch (err) {
            setUpdateStatus({ type: 'error', message: 'Failed to generate QR code' })
        }
    }

    async function handleVerify2FA() {
        setUpdateStatus(null)
        const result = await verify2FA(twoFAFactorId, verificationCode)

        if (result.error) {
            setUpdateStatus({ type: 'error', message: result.error })
        } else {
            setUpdateStatus({ type: 'success', message: result.message || '2FA enabled successfully' })
            setShowSetup2FA(false)
            setVerificationCode('')
            setTwoFAEnabled(true)
            setCurrentFactorId(twoFAFactorId)
        }
    }

    async function handleDisable2FA() {
        setUpdateStatus(null)
        const result = await disable2FA(currentFactorId)

        if (result.error) {
            setUpdateStatus({ type: 'error', message: result.error })
        } else {
            setUpdateStatus({ type: 'success', message: result.message || '2FA disabled successfully' })
            setTwoFAEnabled(false)
            setCurrentFactorId('')
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
            </div>

            {updateStatus && (
                <Alert variant={updateStatus.type === 'error' ? 'destructive' : 'default'} className={`mb-6 ${updateStatus.type === 'success' ? 'border-green-500 bg-green-50 text-green-700' : ''}`}>
                    {updateStatus.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    <AlertTitle>{updateStatus.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                    <AlertDescription>{updateStatus.message}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="account" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Account
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="2fa" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        2FA
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your personal details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <UsernameInput
                                value={personalInfo.username}
                                onChange={(value) => setPersonalInfo({ ...personalInfo, username: value })}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={personalInfo.firstName}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={personalInfo.lastName}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={personalInfo.email}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">Email cannot be changed at this time</p>
                            </div>

                            <Button onClick={handleUpdateProfile} className="w-full sm:w-auto">
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Update your password to keep your account secure</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <PasswordStrengthIndicator password={newPassword} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <Button onClick={handleChangePassword} className="w-full sm:w-auto">
                                Update Password
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="2fa">
                    <Card>
                        <CardHeader>
                            <CardTitle>Two-Factor Authentication</CardTitle>
                            <CardDescription>
                                Add an extra layer of security to your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!twoFAEnabled && !showSetup2FA && (
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Two-factor authentication (2FA) adds an extra layer of security by requiring a code from your authenticator app when signing in.
                                    </p>
                                    <Button onClick={handleEnable2FA}>
                                        <Shield className="mr-2 h-4 w-4" />
                                        Enable 2FA
                                    </Button>
                                </div>
                            )}

                            {showSetup2FA && (
                                <div className="space-y-4">
                                    <Alert>
                                        <Shield className="h-4 w-4" />
                                        <AlertTitle>Set up your authenticator app</AlertTitle>
                                        <AlertDescription>
                                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                        </AlertDescription>
                                    </Alert>

                                    <div className="flex justify-center">
                                        {qrCodeUrl && <img src={qrCodeUrl} alt="2FA QR Code" className="border rounded-lg p-4" />}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Or enter this secret manually:</Label>
                                        <Input value={twoFASecret} readOnly className="bg-muted font-mono text-sm" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="verificationCode">Enter 6-digit code from your app</Label>
                                        <Input
                                            id="verificationCode"
                                            type="text"
                                            maxLength={6}
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            className="font-mono text-lg tracking-widest text-center"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={handleVerify2FA} disabled={verificationCode.length !== 6}>
                                            Verify & Enable
                                        </Button>
                                        <Button variant="outline" onClick={() => setShowSetup2FA(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {twoFAEnabled && !showSetup2FA && (
                                <div className="space-y-4">
                                    <Alert className="border-green-500 bg-green-50">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertTitle className="text-green-600">2FA is enabled</AlertTitle>
                                        <AlertDescription className="text-green-600">
                                            Your account is protected with two-factor authentication
                                        </AlertDescription>
                                    </Alert>

                                    <Button variant="destructive" onClick={handleDisable2FA}>
                                        Disable 2FA
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preferences</CardTitle>
                            <CardDescription>Customize your FinanceHub experience</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <TimezoneForm initialTimezone="UTC" />
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Management</CardTitle>
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
                </TabsContent>
            </Tabs>
        </div>
    )
}
