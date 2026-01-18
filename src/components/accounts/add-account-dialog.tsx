'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { AccountType, createAccount, addPaymentMethod } from '@/actions/accounts'
import { Plus, Trash2, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AddAccountDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface TempPaymentMethod {
    id: string
    name: string
    lastFour: string
    type: 'DEBIT_CARD' | 'CREDIT_CARD'
}

export function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [name, setName] = React.useState('')
    const [type, setType] = React.useState<AccountType>('ASSET')

    // Payment Methods State
    const [methods, setMethods] = React.useState<TempPaymentMethod[]>([])
    const [newMethodName, setNewMethodName] = React.useState('')
    const [newMethodLastFour, setNewMethodLastFour] = React.useState('')

    const resetForm = () => {
        setName('')
        setType('ASSET')
        setMethods([])
        setNewMethodName('')
        setNewMethodLastFour('')
    }

    const handleAddMethod = () => {
        if (!newMethodName || !newMethodLastFour) return
        if (newMethodLastFour.length !== 4 || isNaN(Number(newMethodLastFour))) {
            alert('Last 4 digits must be exactly 4 numbers')
            return
        }

        const methodType = type === 'LIABILITY' ? 'CREDIT_CARD' : 'DEBIT_CARD'

        setMethods(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            name: newMethodName,
            lastFour: newMethodLastFour,
            type: methodType
        }])

        setNewMethodName('')
        setNewMethodLastFour('')
    }

    const removeMethod = (id: string) => {
        setMethods(prev => prev.filter(m => m.id !== id))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return

        setIsSubmitting(true)

        try {
            // 1. Create Account
            // We use the createAccount action from actions/accounts
            // Note: We need to modify createAccount to return the ID of the created account!
            // Currently it returns { success: true } or { error }.
            // I might need to update the action first, or assume it returns data.
            // Let's check the action...
            // It returns { success: true } currently. I'll need to update it to return the new account.

            // Wait, I can't easily change the return type if I don't edit the file. 
            // I will update the action in a separate step or just assume I will update it.
            // For now, I will write this assuming createAccount returns { success: true, account: { id: ... } }
            // If strictly needed, I'll update the action in the next step.

            // Actually, better to update the action first or handle it here.
            // Let's proceed with writing this component, and I'll update the action immediately after.

            const result = await createAccount(name, type)

            if (result.error || !result.data) {
                throw new Error(result.error || 'Failed to create account')
            }

            const accountId = result.data.id

            // 2. Add Payment Methods
            for (const method of methods) {
                await addPaymentMethod(accountId, method.type, method.name, method.lastFour)
            }

            resetForm()
            onOpenChange(false)
            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const showPaymentMethods = ['ASSET', 'LIABILITY'].includes(type)
    const methodLabel = type === 'LIABILITY' ? 'Credit Cards' : 'Debit Cards'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Account</DialogTitle>
                    <DialogDescription>
                        Create a new account and link your payment cards.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Account Type</Label>
                            <Select
                                value={type}
                                onValueChange={(v) => {
                                    setType(v as AccountType)
                                    setMethods([]) // Clear methods on type change
                                }}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ASSET">Asset (Bank, Cash)</SelectItem>
                                    <SelectItem value="LIABILITY">Liability (Credit Card, Loan)</SelectItem>
                                    <SelectItem value="INCOME">Income</SelectItem>
                                    <SelectItem value="EXPENSE">Expense</SelectItem>
                                    <SelectItem value="EQUITY">Equity</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Account Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={type === 'ASSET' ? "e.g., Chase Checking" : "e.g., Amex Gold"}
                                required
                            />
                        </div>

                        {showPaymentMethods && (
                            <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    {methodLabel}
                                </h4>

                                {/* List of added methods */}
                                {methods.length > 0 && (
                                    <div className="space-y-2">
                                        {methods.map(method => (
                                            <div key={method.id} className="flex items-center justify-between text-sm bg-background p-2 rounded border">
                                                <div className="flex gap-2">
                                                    <span className="font-medium">{method.name}</span>
                                                    <span className="text-muted-foreground">....{method.lastFour}</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive"
                                                    onClick={() => removeMethod(method.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add new method inputs */}
                                <div className="grid grid-cols-5 gap-2 items-end">
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-xs">Card Name</Label>
                                        <Input
                                            value={newMethodName}
                                            onChange={(e) => setNewMethodName(e.target.value)}
                                            placeholder="e.g. John's"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-xs">Last 4 Digits</Label>
                                        <Input
                                            value={newMethodLastFour}
                                            onChange={(e) => {
                                                if (e.target.value.length <= 4) {
                                                    setNewMethodLastFour(e.target.value)
                                                }
                                            }}
                                            placeholder="1234"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="h-8 col-span-1"
                                        onClick={handleAddMethod}
                                        disabled={!newMethodName || newMethodLastFour.length !== 4}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Account'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
