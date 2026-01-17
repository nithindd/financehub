'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { getVendorMappings, createVendorMapping, deleteVendorMapping } from '@/actions/vendors'
import { getAccounts, type Account } from '@/actions/accounts'
import { useRouter } from 'next/navigation'

export function VendorMappingsClient({ initialMappings, accounts }: {
    initialMappings: any[],
    accounts: Account[]
}) {
    const router = useRouter()
    const [vendorPattern, setVendorPattern] = React.useState('')
    const [selectedAccount, setSelectedAccount] = React.useState('')
    const [isAdding, setIsAdding] = React.useState(false)

    const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE')

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!vendorPattern || !selectedAccount) return

        setIsAdding(true)
        const result = await createVendorMapping(vendorPattern, selectedAccount)
        setIsAdding(false)

        if (result.error) {
            alert('Failed to add mapping: ' + result.error)
        } else {
            setVendorPattern('')
            setSelectedAccount('')
            router.refresh()
        }
    }

    const handleDelete = async (id: string, pattern: string) => {
        if (!confirm(`Delete mapping for "${pattern}"?`)) return

        const result = await deleteVendorMapping(id)
        if (result.error) {
            alert('Failed to delete: ' + result.error)
        } else {
            router.refresh()
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Add Vendor Mapping</CardTitle>
                    <CardDescription>
                        Map vendor names to categories for automatic categorization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="vendor">Vendor Pattern</Label>
                                <Input
                                    id="vendor"
                                    placeholder="e.g., walmart, amazon"
                                    value={vendorPattern}
                                    onChange={(e) => setVendorPattern(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Case-insensitive, partial match
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={selectedAccount} onValueChange={setSelectedAccount} required>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {expenseAccounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button type="submit" disabled={isAdding}>
                            <Plus className="h-4 w-4 mr-2" />
                            {isAdding ? 'Adding...' : 'Add Mapping'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Mappings</CardTitle>
                    <CardDescription>{initialMappings.length} vendor mappings</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {initialMappings.map((mapping: any) => {
                            const account = accounts.find(a => a.id === mapping.account_id)
                            return (
                                <div key={mapping.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <span className="font-medium">{mapping.vendor_pattern}</span>
                                        <span className="text-sm text-muted-foreground ml-2">→ {account?.name}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => handleDelete(mapping.id, mapping.vendor_pattern)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        })}
                        {initialMappings.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No vendor mappings yet. Add one above to get started!
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
