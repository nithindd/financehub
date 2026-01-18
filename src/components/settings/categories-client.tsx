'use client'

import * as React from 'react'
import { Account, AccountType, updateAccount, deleteAccount, updatePaymentMethod, deletePaymentMethod } from '@/actions/accounts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AddAccountDialog } from '@/components/accounts/add-account-dialog'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PaymentMethod } from '@/types/accounts'

interface CategoriesClientProps {
    initialAccounts: Account[]
}

export function CategoriesClient({ initialAccounts }: CategoriesClientProps) {
    const router = useRouter()
    const [isAddOpen, setIsAddOpen] = React.useState(false)

    // Account Edit State
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [editingAccount, setEditingAccount] = React.useState<Account | null>(null)
    const [editName, setEditName] = React.useState('')

    // Payment Method Edit State
    const [isPmEditOpen, setIsPmEditOpen] = React.useState(false)
    const [editingPm, setEditingPm] = React.useState<PaymentMethod | null>(null)
    const [editPmName, setEditPmName] = React.useState('')
    const [editPmLastFour, setEditPmLastFour] = React.useState('')
    const [editPmType, setEditPmType] = React.useState<'DEBIT_CARD' | 'CREDIT_CARD'>('DEBIT_CARD')

    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const grouped = {
        INCOME: initialAccounts.filter(a => a.type === 'INCOME'),
        EXPENSE: initialAccounts.filter(a => a.type === 'EXPENSE'),
        ASSET: initialAccounts.filter(a => a.type === 'ASSET'),
        LIABILITY: initialAccounts.filter(a => a.type === 'LIABILITY'),
        EQUITY: initialAccounts.filter(a => a.type === 'EQUITY')
    }

    // --- Account Handlers ---

    const handleEditAccount = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingAccount || !editName.trim()) return

        setIsSubmitting(true)
        const result = await updateAccount(editingAccount.id, editName.trim())
        setIsSubmitting(false)

        if (result.error) {
            alert('Failed to update category: ' + result.error)
        } else {
            setIsEditOpen(false)
            setEditingAccount(null)
            router.refresh()
        }
    }

    const handleDeleteAccount = async (account: Account) => {
        if (!confirm(`Delete "${account.name}"? This cannot be undone.`)) return

        const result = await deleteAccount(account.id)
        if (result.error) {
            alert('Failed to delete: ' + result.error)
        } else {
            router.refresh()
        }
    }

    const openEditAccount = (account: Account) => {
        setEditingAccount(account)
        setEditName(account.name)
        setIsEditOpen(true)
    }

    // --- Payment Method Handlers ---

    const openEditPm = (pm: PaymentMethod) => {
        setEditingPm(pm)
        setEditPmName(pm.name)
        setEditPmLastFour(pm.last_four)
        setEditPmType(pm.type)
        setIsPmEditOpen(true)
    }

    const handleEditPm = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingPm || !editPmName.trim() || !editPmLastFour.trim()) return

        setIsSubmitting(true)
        const result = await updatePaymentMethod(editingPm.id, editPmName.trim(), editPmLastFour, editPmType)
        setIsSubmitting(false)

        if (result.error) {
            alert('Failed to update payment method: ' + result.error)
        } else {
            setIsPmEditOpen(false)
            setEditingPm(null)
            router.refresh()
        }
    }

    const handleDeletePm = async (pm: PaymentMethod) => {
        if (!confirm(`Remove card "${pm.name} (...${pm.last_four})"?`)) return

        const result = await deletePaymentMethod(pm.id)
        if (result.error) {
            alert('Failed to delete payment method: ' + result.error)
        } else {
            router.refresh()
        }
    }


    return (
        <>
            <div className="grid gap-6">
                {Object.entries(grouped).map(([type, accts]) => (
                    <Card key={type}>
                        <CardHeader>
                            <CardTitle>{type}</CardTitle>
                            <CardDescription>{accts.length} categories</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {accts.map(account => (
                                    <div key={account.id} className="p-3 border rounded-lg bg-card text-card-foreground shadow-sm">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="font-medium flex items-center gap-2 text-lg">
                                                {account.name}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => openEditAccount(account)}
                                                    title="Edit Account Name"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => handleDeleteAccount(account)}
                                                    title="Delete Account"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {account.payment_methods && account.payment_methods.length > 0 && (
                                            <div className="flex flex-col gap-2 mt-2 pl-4 border-l-2 ml-1">
                                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Linked Cards</p>
                                                {account.payment_methods.map(pm => (
                                                    <div key={pm.id} className="flex items-center justify-between text-sm bg-muted/40 p-2 rounded-md group">
                                                        <div className="flex items-center gap-3">
                                                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                                                            <span>{pm.name}</span>
                                                            <Badge variant="outline" className="text-[10px] h-5 font-mono">
                                                                ...{pm.last_four}
                                                            </Badge>
                                                            <span className="text-[10px] text-muted-foreground uppercase">{pm.type.replace('_', ' ')}</span>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => openEditPm(pm)}
                                                                title="Edit Card"
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-destructive hover:text-destructive"
                                                                onClick={() => handleDeletePm(pm)}
                                                                title="Remove Card"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
                        <Button onClick={() => setIsAddOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Account
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <AddAccountDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

            {/* Edit Account Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>Update category name</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditAccount} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Category Name</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Payment Method Dialog */}
            <Dialog open={isPmEditOpen} onOpenChange={setIsPmEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Payment Method</DialogTitle>
                        <DialogDescription>Update card details</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditPm} className="space-y-4">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pm-name">Card Name (e.g. "Chase Freedom")</Label>
                                <Input
                                    id="pm-name"
                                    value={editPmName}
                                    onChange={(e) => setEditPmName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pm-type">Type</Label>
                                    <Select
                                        value={editPmType}
                                        onValueChange={(v: 'DEBIT_CARD' | 'CREDIT_CARD') => setEditPmType(v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                                            <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pm-last-four">Last 4 Digits</Label>
                                    <Input
                                        id="pm-last-four"
                                        maxLength={4}
                                        pattern="\d{4}"
                                        value={editPmLastFour}
                                        onChange={(e) => setEditPmLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsPmEditOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
