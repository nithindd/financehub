'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function processInvoice(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) return { error: 'No file provided' };

    if (!process.env.GOOGLE_API_KEY) {
        return { error: 'Server missing GOOGLE_API_KEY' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        const mimeType = file.type;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      Analyze this invoice/receipt image. Extract the following fields in JSON format:
      - date (YYYY-MM-DD)
      - description (Vendor name and brief summary of items)
      - totalAmount (number)
      
      If you cannot find a value, use null. Return ONLY raw JSON, no markdown formatting.
    `;

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

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return { data: JSON.parse(cleanText) };
    } catch (error: any) {
        console.error('OCR Error:', error);
        return { error: error.message || 'Failed to process image' };
    }
}
