'use server'

import { createClient } from '@/utils/supabase/server'
const pdfParse = require('pdf-parse')

export async function parsePdfStatement(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) {
        return { success: false, error: 'No file provided' }
    }

    try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const data = await pdfParse(buffer)
        const text = data.text

        // Basic Tabular Extraction Logic
        const lines = text.split('\n').filter((line: string) => line.trim())
        const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/
        const rows: Array<Record<string, string>> = []

        for (const line of lines) {
            if (datePattern.test(line)) {
                // Split by multiple spaces or tabs
                const parts = line.split(/\s{2,}|\t+/).filter((p: string) => p.trim())

                if (parts.length >= 3) {
                    // Heuristic:
                    // 1. First part is likely Date
                    // 2. Last part is likely Amount
                    // 3. Everything in between is Description

                    const dateVal = parts[0].trim()
                    const amountVal = parts[parts.length - 1].trim()

                    // Simple check if amount looks like a number
                    if (/[0-9]/.test(amountVal)) {
                        rows.push({
                            'Date': dateVal,
                            'Description': parts.slice(1, -1).join(' ').trim(),
                            'Amount': amountVal
                        })
                    }
                }
            }
        }

        if (rows.length === 0) {
            return { success: false, error: 'Could not detect tabular transactions in PDF. Please ensure dates are clearly visible.' }
        }

        return { success: true, data: rows }
    } catch (error: any) {
        console.error('PDF Parse Error:', error)
        return { success: false, error: 'Failed to parse PDF: ' + error.message }
    }
}
