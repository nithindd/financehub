'use server'

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const GEN_AI_MODEL = "gemini-3-flash-preview";

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
                        description: { type: SchemaType.STRING, description: "Vendor name and brief summary of items" },
                        totalAmount: { type: SchemaType.NUMBER, description: "Total amount on the invoice" }
                    },
                    required: ["date", "description", "totalAmount"]
                }
            }
        });


        const prompt = "Analyze this invoice/receipt image and extract metadata.";

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

