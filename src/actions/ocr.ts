'use server'

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createClient } from '@/utils/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const GEN_AI_MODEL = "gemini-3-flash-preview";

// ... existing imports

export async function processInvoice(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const file = formData.get('file') as File;
    console.log("OCR Action: Started processing");

    if (!file) {
        return { error: 'No file provided' };
    }

    // ... existing key check ...
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        console.error('OCR Error: GOOGLE_API_KEY is missing');
        return { error: 'Server configuration error' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        const mimeType = file.type;

        const model = genAI.getGenerativeModel({
            model: GEN_AI_MODEL,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        date: { type: SchemaType.STRING, description: "Date in YYYY-MM-DD format" },
                        vendor: { type: SchemaType.STRING, description: "Name of the store or vendor" },
                        totalAmount: { type: SchemaType.NUMBER, description: "Total amount on the invoice" },
                        tax: { type: SchemaType.NUMBER, description: "Total tax amount found on invoice" },
                        tip: { type: SchemaType.NUMBER, description: "Tip/gratuity amount if present" },
                        cardLastFour: { type: SchemaType.STRING, description: "Last 4 digits of credit/debit card if visible" },
                        items: {
                            type: SchemaType.ARRAY,
                            description: "List of individual line items",
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    description: { type: SchemaType.STRING, description: "Item description" },
                                    amount: { type: SchemaType.NUMBER, description: "Item price" }
                                },
                                required: ["description", "amount"]
                            }
                        }
                    },
                    required: ["date", "vendor", "totalAmount", "tax", "items"]
                }
            }
        });

        const prompt = "Analyze this invoice/receipt. Extract date, vendor, total, tax, tip, and line items. Critically, look for the 'Last 4 digits' of the payment card (often marked as *************1234 or Account: 1234).";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Image, mimeType: mimeType } }
        ]);

        const response = await result.response;
        const text = response.text();
        console.log("Gemini OCR Response:", text);
        const parsedData = JSON.parse(text);

        // MATCHING LOGIC
        if (parsedData.cardLastFour) {
            // Remove any non-digit chars just in case
            const lastFour = parsedData.cardLastFour.replace(/\D/g, '');

            if (lastFour.length === 4) {
                const { data: methods } = await supabase
                    .from('payment_methods')
                    .select('account_id, id, name')
                    .eq('user_id', user.id)
                    .eq('last_four', lastFour)

                if (methods && methods.length > 0) {
                    console.log(`OCR Match: Found linked account for card ...${lastFour}`);
                    parsedData.matchedAccount = {
                        accountId: methods[0].account_id,
                        paymentMethodId: methods[0].id,
                        methodName: methods[0].name
                    };
                }
            }
        }

        return { data: parsedData };
    } catch (error: any) {
        console.error('OCR Action Error:', error);
        return { error: error.message || 'Failed to process image' };
    }
}
