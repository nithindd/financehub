'use client'

import * as React from 'react'
import { Account, AccountType, createAccount, updateAccount, deleteAccount } from '@/actions/accounts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CategoriesClientProps {
    initialAccounts: Account[]
}

export function CategoriesClient({ initialAccounts }: CategoriesClientProps) {
    const router = useRouter()
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [editingAccount, setEditingAccount] = React.useState<Account | null>(null)

    const [newName, setNewName] = React.useState('')
    const [newType, setNewType] = React.useState<AccountType>('EXPENSE')
    const [editName, setEditName] = React.useState('')
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const grouped = {
        INCOME: initialAccounts.filter(a => a.type === 'INCOME'),
        EXPENSE: initialAccounts.filter(a => a.type === 'EXPENSE'),
        ASSET: initialAccounts.filter(a => a.type === 'ASSET'),
        LIABILITY: initialAccounts.filter(a => a.type === 'LIABILITY')
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName.trim()) return

        setIsSubmitting(true)
        const result = await createAccount(newName.trim(), newType)
        setIsSubmitting(false)

        if (result.error) {
            alert('Failed to create category: ' + result.error)
        } else {
            setNewName('')
            setNewType('EXPENSE')
            setIsAddOpen(false)
            router.refresh()
        }
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
                            <div className="space-y-2">
                                {accts.map(account => (
                                    <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <span className="font-medium">{account.name}</span>
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
                            Add New Category
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Add Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>Create a new account category</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name</Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g., Groceries, Salary"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select value={newType} onValueChange={(v) => setNewType(v as AccountType)}>
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INCOME">Income</SelectItem>
                                    <SelectItem value="EXPENSE">Expense</SelectItem>
                                    <SelectItem value="ASSET">Asset</SelectItem>
                                    <SelectItem value="LIABILITY">Liability</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
