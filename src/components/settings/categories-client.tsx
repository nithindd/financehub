'use client'

import * as React from 'react'
import { Account, AccountType, updateAccount, deleteAccount } from '@/actions/accounts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AddAccountDialog } from '@/components/accounts/add-account-dialog'
import { Badge } from '@/components/ui/badge'

interface CategoriesClientProps {
    initialAccounts: Account[]
}

export function CategoriesClient({ initialAccounts }: CategoriesClientProps) {
    const router = useRouter()
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [editingAccount, setEditingAccount] = React.useState<Account | null>(null)

    const [editName, setEditName] = React.useState('')
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const grouped = {
        INCOME: initialAccounts.filter(a => a.type === 'INCOME'),
        EXPENSE: initialAccounts.filter(a => a.type === 'EXPENSE'),
        ASSET: initialAccounts.filter(a => a.type === 'ASSET'),
        LIABILITY: initialAccounts.filter(a => a.type === 'LIABILITY'),
        EQUITY: initialAccounts.filter(a => a.type === 'EQUITY')
    }

    const handleEdit = async (e: React.FormEvent) => {
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

    const handleDelete = async (account: Account) => {
        if (!confirm(`Delete "${account.name}"? This cannot be undone.`)) return

        const result = await deleteAccount(account.id)
        if (result.error) {
            alert('Failed to delete: ' + result.error)
        } else {
            router.refresh()
        }
    }

    const openEdit = (account: Account) => {
        setEditingAccount(account)
        setEditName(account.name)
        setIsEditOpen(true)
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
                                    <div key={account.id} className="flex items-start justify-between p-3 border rounded-lg bg-card text-card-foreground shadow-sm">
                                        <div className="space-y-1">
                                            <div className="font-medium flex items-center gap-2">
                                                {account.name}
                                            </div>
                                            {account.payment_methods && account.payment_methods.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {account.payment_methods.map(pm => (
                                                        <Badge key={pm.id} variant="secondary" className="text-xs font-normal">
                                                            <CreditCard className="w-3 h-3 mr-1" />
                                                            {pm.name} (...{pm.last_four})
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => openEdit(account)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => handleDelete(account)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
                        <Button onClick={() => setIsAddOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Account
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <AddAccountDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>Update category name</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
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
        </>
    )
}
