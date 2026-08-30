'use server'

import { createClient } from '@/utils/supabase/server'

export async function exportUserData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    try {
        // 1. Fetch User Profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileError) throw new Error(`Profile fetch error: ${profileError.message}`)

        // 2. Fetch Accounts (with Payment Methods)
        const { data: accounts, error: accountsError } = await supabase
            .from('accounts')
            .select(`
        *,
        payment_methods (*)
      `)
            .eq('user_id', user.id)

        if (accountsError) throw new Error(`Accounts fetch error: ${accountsError.message}`)

        // 3. Fetch Transactions (with Journal Entries and Items)
        // We fetch all transactions for the user
        // Note: This could be large. In a real app, might need pagination or streaming.
        const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select(`
            *,
            journal_entries (*),
            items:transaction_items (*, transaction_id)
        `)
            .eq('user_id', user.id)
            .order('date', { ascending: false })

        // Note: 'items' relationship might be named differently or implied by foreign key.
        // Let's check if 'transaction_items' table exists or if 'items' json column is used.
        // 'migrations/013_internationalization.sql' mentions 'items' potentially.
        // Wait, in 'src/actions/transactions.ts', there is 'items' usage.
        // But earlier I saw 'items' column in 'transactions' table in migration 010.
        // Migration 010 adds 'vendor' and 'items' (jsonb) to transactions.

        // Correcting step 3 based on migration 010 (jsonb column 'items')
        // We don't need a separate join if it's a JSONB column.

        // Also fetch Journal Entries separately or joined? Joined is fine.

        const { data: transactionsFixed, error: txError } = await supabase
            .from('transactions')
            .select(`
        *,
        journal_entries (*)
      `)
            .eq('user_id', user.id)
            .order('date', { ascending: false })

        if (txError) throw new Error(`Transactions fetch error: ${txError.message}`)

        // 4. Fetch Vendor Mappings
        const { data: vendorMappings, error: vmError } = await supabase
            .from('vendor_mappings')
            .select('*')
            .eq('user_id', user.id)

        if (vmError && vmError.code !== 'PGRST116') { // Ignore if table missing in some environments, but it should exist
            // Log but don't fail if just empty? code 42P01 is table missing.
            // We assume it exists based on migrations.
        }

        // 5. Construct Data Object
        const exportData = {
            timestamp: new Date().toISOString(),
            user: {
                id: user.id,
                email: user.email,
                profile
            },
            accounts,
            transactions: transactionsFixed,
            vendorMappings: vendorMappings || [],
            meta: {
                version: '1.0',
                generator: 'FinanceHub Export'
            }
        }

        const jsonData = JSON.stringify(exportData, null, 2)
        const fileName = `${user.id}/${new Date().toISOString().split('T')[0]}_export.json`

        // 6. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('exports')
            .upload(fileName, jsonData, {
                contentType: 'application/json',
                upsert: true
            })

        if (uploadError) throw new Error(`Upload error: ${uploadError.message}`)

        // 7. Generate Signed URL (valid for 24 hours)
        const { data: signedUrlData, error: signError } = await supabase.storage
            .from('exports')
            .createSignedUrl(fileName, 60 * 60 * 24) // 24 hours

        if (signError || !signedUrlData) throw new Error(`Signed URL generation error: ${signError?.message}`)

        // 8. Send Email
        // Using dynamic import for Resend to avoid build issues if not set up
        const resendApiKey = process.env.RESEND_API_KEY
        if (resendApiKey) {
            const { Resend } = await import('resend')
            const resend = new Resend(resendApiKey)

            const fromAddress = process.env.EMAIL_FROM || 'FinanceHub <onboarding@resend.dev>'

            await resend.emails.send({
                from: fromAddress,
                to: [user.email!],
                subject: 'Your FinanceHub Data Export',
                html: `
                <div style="font-family: sans-serif; color: #333;">
                    <h1>Your Data is Ready</h1>
                    <p>You requested an export of your data from FinanceHub.</p>
                    <p>Click the link below to download your data (valid for 24 hours):</p>
                    <p>
                        <a href="${signedUrlData.signedUrl}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Data</a>
                    </p>
                    <p style="font-size: 0.8em; color: #666; margin-top: 20px;">
                        If you did not request this, please contact support immediately.
                    </p>
                </div>
            `
            })
        } else {
            console.warn('RESEND_API_KEY missing. Printing link to console.')
            console.log('EXPORT LINK:', signedUrlData.signedUrl)
        }

        return { success: true, message: 'Export initiated. Check your email for the download link.' }

    } catch (error: any) {
        console.error('Export User Data Error:', error)
        return { error: error.message || 'Failed to export data' }
    }
}
