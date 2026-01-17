# Custom Domain Setup Guide: financehubapp.com

This guide walks you through setting up your custom domain `financehubapp.com` for your FinanceHub application deployed on Vercel.

## Prerequisites

- ✅ FinanceHub deployed on Vercel
- ✅ Domain `financehubapp.com` purchased and accessible
- ✅ Access to your domain registrar's DNS settings

## Step 1: Add Domain in Vercel

1. **Navigate to Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your FinanceHub project

2. **Add Custom Domain**
   - Click **Settings** → **Domains**
   - Enter `financehubapp.com` in the input field
   - Click **Add**
   - Vercel will provide DNS configuration instructions

3. **Optional: Add WWW Subdomain**
   - Also add `www.financehubapp.com`
   - Vercel will automatically redirect www to root domain

## Step 2: Configure DNS Records

Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add these DNS records:

### For Root Domain (financehubapp.com)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| `A` | `@` | `76.76.21.21` | 3600 |

### For WWW Subdomain (www.financehubapp.com)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| `CNAME` | `www` | `cname.vercel-dns.com` | 3600 |

> **Note**: Some registrars use different terminology:
> - `@` might be shown as "root" or blank
> - TTL is often auto-set, default is fine

## Step 3: Wait for DNS Propagation

- **Typical Time**: 5-30 minutes
- **Maximum Time**: Up to 48 hours
- **Check Status**: Use https://dnschecker.org to verify propagation

Vercel will automatically:
- ✅ Verify DNS configuration
- ✅ Issue SSL certificate (via Let's Encrypt)
- ✅ Enable HTTPS

## Step 4: Update OAuth Redirect URIs

### Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add to **Redirect URLs**:
   ```
   https://financehubapp.com/auth/callback
   https://www.financehubapp.com/auth/callback
   ```
4. Keep existing Vercel URLs for testing

### Google Cloud Console

1. Go to https://console.cloud.google.com
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, ensure you have:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
   (This doesn't change, Supabase handles the redirect)

## Step 5: Update Environment Variables (If Needed)

If you have any hardcoded URLs in your code or environment variables:

1. In Vercel Dashboard → **Settings** → **Environment Variables**
2. Update any URLs that reference your old domain
3. Redeploy if you made changes

## Step 6: Test Your Domain

1. **Visit Your Domain**
   - Go to https://financehubapp.com
   - Verify the site loads correctly
   - Check for SSL padlock in browser

2. **Test Authentication**
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Verify successful login

3. **Test All Features**
   - Create a transaction
   - Upload an invoice
   - Generate a report
   - Send an email

## Troubleshooting

### Domain Not Working After 24 Hours

- **Check DNS**: Use `nslookup financehubapp.com` or https://dnschecker.org
- **Verify Records**: Ensure A record points to `76.76.21.21`
- **Clear Cache**: Try incognito mode or different browser

### SSL Certificate Issues

- Vercel automatically provisions SSL
- If issues persist, remove and re-add domain in Vercel
- Check Vercel's status page: https://vercel.com/status

### OAuth Redirect Errors

- Verify all redirect URIs are added in Supabase
- Check for typos in URLs
- Ensure HTTPS is used (not HTTP)

### Mixed Content Warnings

- All resources must be loaded over HTTPS
- Check for hardcoded HTTP URLs in your code

## Email Configuration (Resend)

If using custom domain for emails:

1. **Add Domain to Resend**
   - Go to https://resend.com/domains
   - Add `financehubapp.com`
   - Follow DNS verification steps

2. **Update Environment Variable**
   ```env
   EMAIL_FROM="FinanceHub <noreply@financehubapp.com>"
   ```

3. **Redeploy** to apply changes

## Post-Setup Checklist

- [ ] Domain resolves to Vercel
- [ ] SSL certificate active (HTTPS working)
- [ ] Google OAuth login works
- [ ] All pages load correctly
- [ ] Email reports send successfully
- [ ] Invoice OCR functions properly
- [ ] Mobile access works

## Additional Resources

- [Vercel Custom Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [DNS Propagation Checker](https://dnschecker.org)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

---

**Need Help?** Check Vercel's support or consult your domain registrar's documentation for DNS configuration.

**Estimated Total Time**: 30 minutes + DNS propagation (5-30 minutes)
