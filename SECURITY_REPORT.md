# Security & Compliance Audit Report: FinanceHub

## 1. Executive Summary
The application functionality is robust, utilizing modern AI for financial automation. However, the handling of sensitive financial documents (bank statements, invoices) presents significant security risks in its current configuration. Specifically, the use of **publicly accessible storage** for sensitive evidence files is a critical vulnerability that needs immediate attention.

## 2. Critical Vulnerabilities

### 🔴 Public Storage Buckets
**Severity: CRITICAL**
- **Issue**: The Supabase Storage bucket `evidence` is configured as `public`.
- **Impact**: Any file uploaded (bank statements, receipts) receives a predictable, public URL. If this URL is guessed or leaked, **anyone on the internet** can download the user's unredacted financial documents without authentication.
- **Code Reference**: `migrations/004_storage_setup.sql` sets `public` to `true`.
- **Recommendation**: 
    1. Change bucket visibility to **Private**.
    2. Implement **Signed URLs** (Presigned URLs) for generating temporary, authenticated access links for the frontend.
    3. Update `StatementUploader` to avoid relying on `getPublicUrl`.

### 🟠 Unredacted PII/PCI Data Transmission
**Severity: HIGH**
- **Issue**: Users upload unredacted PDFs which are sent directly to 1) Supabase Storage and 2) Google Gemini AI.
- **Impact**: 
    - **PCI-DSS**: If a user uploads a statement containing a full 16-digit Credit Card Number (PAN), the application and database become subject to strict PCI-DSS compliance requirements. Storing full PAN data is a major violation for non-certified systems.
    - **GDPR/CCPA**: Storing unencrypted PII (names, addresses, account numbers) requires strict data governance, right-to-deletions, and breach notification protocols.
- **Recommendation**:
    - **User Warning**: Explicitly warn users to redact sensitive numbers (Account #, PAN) before uploading.
    - **Data Minimization**: Do not retain the original PDF in storage if strictly not needed for audit, or implement an auto-deletion policy (e.g., delete PDF after 30 days).

## 3. Compliance Analysis

### PCI-DSS (Payment Card Industry Data Security Standard)
*   **Current Status**: **Non-Compliant** (if card numbers are uploaded).
*   **Risk**: Storing arbitrary user-uploaded PDFs means you cannot guarantee no credit card numbers are stored.
*   **Mitigation**: 
    - Implement a "No PAN" policy.
    - Use a DLP (Data Loss Prevention) API to scan and redact PANs before storage (Advanced).
    - **Minimum Action**: Add a disclaimer: *"Do not upload documents containing full credit card numbers."*

### GDPR (General Data Protection Regulation)
*   **Current Status**: **Partial Compliance**.
*   **Good**: RLS policies isolate data by User ID. Delete functions exist.
*   **Bad**: Public storage bucket violates "Data Protection by Design and Default".
*   **Mitigation**: Fix the storage bucket visibility immediately.

## 4. Recommended Action Plan

### Immediate Steps (Low Effort)
1.  **UI Warning**: Add an Alert in the `StatementUploader` and `TransactionDialog` warning users: *"Please redact/black out full credit card numbers and account numbers before uploading."*
2.  **Privacy Policy**: Update application terms to state that users are responsible for redacting sensitive data.

### Medium Term (High Priority)
1.  **Secure Storage**: Refactor the app to use Private Buckets.
    - Update Supabase Bucket to Private.
    - Create a Server Action to generate `createSignedUrl` for viewing evidence.
    - Replace `getPublicUrl` calls with this signed URL mechanism.

### Long Term (Best Practice)
1.  **Auto-Redaction**: Integrate Cloud DLP (Data Loss Prevention) to automatically blur or mask credit card numbers in uploaded images/PDFs before they are saved to disk.
2.  **Ephemeral Processing**: Only send the file to Gemini for extraction, return the data, but **do NOT save the file** to Storage at all unless the user explicitly checks "Save Evidence for Audit".

## 5. Conclusion
Using OCR/AI on financial documents is standard industry practice, but **storage** is the weak point. By switching to Private Buckets and implementing Signed URLs, you can mitigate 90% of the immediate security risk. The compliance risk (PCI/PII) requires a combination of user education (warnings) and technical safeguards (redaction).
