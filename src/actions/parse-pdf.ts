'use server'

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const GEN_AI_MODEL = "gemini-1.5-flash"; // Flash is fast and good for high-volume text

export async function parsePdfStatement(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) {
        return { success: false, error: 'No file provided' }
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        const mimeType = file.type;

        // Structured output for transactions list
        const model = genAI.getGenerativeModel({
            model: GEN_AI_MODEL,
            generationConfig: {
                // responseMimeType: "application/json", // Some older models/keys struggle with enforced JSON mode on arrays directly, but Flash handles it well usually.
                // Let's use loose JSON prompting for safety or Schema if we want strictness.
                // Strict Schema for a LIST is cleaner:
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        transactions: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    Date: { type: SchemaType.STRING, description: "Transaction date in MM/DD/YYYY or YYYY-MM-DD format" },
                                    Description: { type: SchemaType.STRING, description: "Transaction description or payee" },
                                    Amount: { type: SchemaType.STRING, description: "Transaction amount (negative for debits/expenses, positive for credits/deposits usually, but just extract the number string)" }
                                },
                                required: ["Date", "Description", "Amount"]
                            }
                        }
                    }
                }
            }
        });

        const prompt = `
            Analyze this bank statement document. 
            Extract all transactions found in the tabular data. 
            Return them as a JSON object with a key 'transactions' containing an array.
            For 'Amount', keep the original formatting (e.g., "-50.00" or "50.00 CR").
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        console.log("Gemini PDF Parse Response:", text.substring(0, 200) + "...");

        const json = JSON.parse(text);

        if (!json.transactions || !Array.isArray(json.transactions)) {
            return { success: false, error: 'AI failed to extract a valid transaction list.' };
        }

        return { success: true, data: json.transactions };

    } catch (error: any) {
        console.error('PDF Parse Action Error:', error);
        return { success: false, error: 'Failed to process PDF with AI: ' + error.message };
    }
}
