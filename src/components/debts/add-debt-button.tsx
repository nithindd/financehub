'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreditorFormDialog } from './creditor-form-dialog'

export function AddDebtButton() {
    const [open, setOpen] = React.useState(false)
    return (
        <>
            <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Debt
            </Button>
            <CreditorFormDialog open={open} onOpenChange={setOpen} />
        </>
    )
}
