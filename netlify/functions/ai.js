import { GoogleGenAI } from '@google/genai';

export const handler = async (event, context) => {
    // Basic CORS headers to allow local frontend to test it
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    // Initialize the AI SDK
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Gemini API Key is not configured." }) };
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const { title, description, category } = JSON.parse(event.body);

        if (!title || !description) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing title or description" }) };
        }

        const prompt = `You are a helpful AI assistant for a university campus issue reporting platform called "Campus Voice". 
A student or staff member has submitted the following issue in the "${category || 'General'}" category:

### Issue Title
${title}

### Issue Description
${description}

Please provide 2-3 specific, actionable, and constructive suggestions or solutions for this issue. 
Your response will be shown to users. Format your response clearly using markdown. Keep it concise, helpful, and empathetic. Do not include introductory/outro fluff - just dive straight into the solutions.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ suggestion: response.text })
        };

    } catch (error) {
        console.error("AI Error:", error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || "Failed to generate AI suggestion" }) };
    }
};
