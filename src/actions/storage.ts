'use server'

import { createClient } from '@/utils/supabase/server'

export async function createSignedUrl(path: string | null) {
    if (!path) return null

    const supabase = await createClient()

    // If the path is a full URL, try to extract the relative path
    // Format: .../storage/v1/object/public/evidence/USER_ID/FOLDER/FILE.ext
    let relativePath = path
    if (path.startsWith('http')) {
        const parts = path.split('/evidence/')
        if (parts.length > 1) {
            relativePath = parts[1]
        }
    }

    // Generate a signed URL valid for 1 hour (3600 seconds)
    const { data, error } = await supabase
        .storage
        .from('evidence')
        .createSignedUrl(relativePath, 3600)

    if (error) {
        console.error('Error creating signed URL:', error)
        return null
    }

    return data.signedUrl
}
