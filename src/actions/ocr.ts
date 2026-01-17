'use server'

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const GEN_AI_MODEL = "gemini-1.5-flash";

export async function processInvoice(formData: FormData) {
    const file = formData.get('file') as File;
    console.log("OCR Action: Started processing");

    if (!file) {
        console.error("OCR Error: No file provided in FormData");
        return { error: 'No file provided' };
    }

    // Debug logging (masked key)
    const key = process.env.GOOGLE_API_KEY;
    console.log(`OCR Action: Checking API Key. Present: ${!!key}, Length: ${key ? key.length : 0}`);

    if (!key) {
        console.error('OCR Error: GOOGLE_API_KEY is missing from process.env');
        return { error: 'Server configuration error: GOOGLE_API_KEY missing. Please check .env.local and restart server.' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        const mimeType = file.type;

        // Using structured output for higher reliability
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
                        items: {
                            type: SchemaType.ARRAY,
                            description: "List of individual line items, products, or charges",
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    description: { type: SchemaType.STRING, description: "Name/description of the product or service" },
                                    amount: { type: SchemaType.NUMBER, description: "Price/amount for this item" }
                                },
                                required: ["description", "amount"]
                            }
                        }
                    },
                    required: ["date", "vendor", "totalAmount", "items"]
                }
            }
        });


        const prompt = "Analyze this invoice/receipt image and extract metadata. If you find multiple line items, list them in the 'items' array.";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        console.log("Gemini OCR Response:", text);

        return { data: JSON.parse(text) };
    } catch (error: any) {
        console.error('OCR Action Error:', error);
        return { error: error.message || 'Failed to process image' };
    }
}
