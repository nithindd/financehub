// pdf-parse is a CommonJS module, use require
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        const pdfParse = require('pdf-parse')
        const data = await pdfParse(buffer)
        return data.text
    } catch (error) {
        console.error('PDF Parse Error:', error)
        throw new Error('Failed to parse PDF')
    }
}

export function parseStatementText(text: string): Array<Record<string, string>> {
    // Split by lines
    const lines = text.split('\n').filter(line => line.trim())

    // Try to detect tabular data
    // Look for lines with dates (common pattern: MM/DD/YYYY or DD-MM-YYYY)
    const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/

    const rows: Array<Record<string, string>> = []

    for (const line of lines) {
        if (datePattern.test(line)) {
            // Split by multiple spaces or tabs
            const parts = line.split(/\s{2,}|\t+/).filter(p => p.trim())

            if (parts.length >= 3) {
                // Assume: Date | Description | Amount (common format)
                rows.push({
                    'Date': parts[0].trim(),
                    'Description': parts.slice(1, -1).join(' ').trim(),
                    'Amount': parts[parts.length - 1].trim()
                })
            }
        }
    }

    return rows
}
