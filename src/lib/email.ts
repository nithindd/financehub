import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
    to: string | string[]
    subject: string
    html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Skipping email sending.')
        // In dev, maybe log the email content?
        if (process.env.NODE_ENV === 'development') {
            console.log('--- EMAIL MOCK ---')
            console.log(`To: ${to}`)
            console.log(`Subject: ${subject}`)
            console.log(html)
            console.log('------------------')
        }
        return { success: false, error: 'Missing API Key' }
    }

    try {
        const data = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'FinanceHub <onboarding@resend.dev>',
            to,
            subject,
            html,
        })

        return { success: true, data }
    } catch (error) {
        console.error('Failed to send email:', error)
        return { success: false, error }
    }
}
