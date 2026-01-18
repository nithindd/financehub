import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    // Get the base URL (Hostheader is more reliable in some proxy setups)
    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const origin = `${protocol}://${host}`

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Check if this is a new user (created within last 30 seconds)
            const { data: { user } } = await supabase.auth.getUser()

            if (user && user.email) {
                const createdAtStr = user.created_at;
                const createdAt = new Date(createdAtStr).getTime();
                const now = new Date().getTime();
                const diff = now - createdAt;

                console.log(`OAuth Callback Debug: User Email: ${user.email}`);
                console.log(`OAuth Callback Debug: Created At Str: ${createdAtStr}, Timestamp: ${createdAt}`);
                console.log(`OAuth Callback Debug: Now: ${now}, Diff: ${diff}`);
                console.log(`OAuth Callback Debug: ADMIN_EMAIL: ${process.env.ADMIN_EMAIL}`);

                // If created in the last 5 minutes (300000ms), consider it a new signup
                // Increased window to handle potential clock skews between auth server and app server
                if (diff < 300000) {
                    // Notify Admin
                    try {
                        const adminEmail = process.env.ADMIN_EMAIL
                        if (adminEmail) {
                            console.log('Sending admin notification for OAuth Signup to:', adminEmail)
                            // Retrieve metadata
                            const metadata = user.user_metadata || {}
                            const name = metadata.full_name || `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim() || 'N/A'
                            const username = metadata.username || user.email.split('@')[0]

                            const emailResult = await sendEmail({
                                to: adminEmail,
                                subject: 'New User Registration (OAuth) - FinanceHub',
                                html: `
                                    <h1>New User Registered via OAuth</h1>
                                    <p><strong>Username:</strong> ${username}</p>
                                    <p><strong>Email:</strong> ${user.email}</p>
                                    <p><strong>Name:</strong> ${name}</p>
                                    <p><strong>Provider:</strong> ${user.app_metadata.provider || 'Google'}</p>
                                `
                            })
                            console.log('OAuth Admin Email Result:', emailResult)
                        }
                    } catch (err) {
                        console.error('Failed to send admin notification for OAuth:', err)
                    }
                }
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

