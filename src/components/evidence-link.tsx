'use client'

import { useState } from 'react'
import { Paperclip, Loader2 } from 'lucide-react'
import { createSignedUrl } from '@/actions/storage'
import { Button } from '@/components/ui/button'

export function EvidenceLink({ path }: { path: string }) {
    const [loading, setLoading] = useState(false)

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setLoading(true)
        try {
            const url = await createSignedUrl(path)
            if (url) {
                window.open(url, '_blank')
            } else {
                alert('Failed to generate secure link for this file.')
            }
        } catch (err) {
            console.error(err)
            alert('Error accessing file.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-primary hover:text-primary/80"
            onClick={handleClick}
            title="View Secure Evidence"
            disabled={loading}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </Button>
    )
}
