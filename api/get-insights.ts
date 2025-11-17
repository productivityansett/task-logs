import { GoogleGenAI } from "@google/genai"; // Only this import is needed
import type { ProductivityLog } from "../types";

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request): Promise<Response> {
  // ... (rest of the initial request handling code) ...

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // ... (error handling) ...
  }

  try {
    const data: ProductivityLog[] = await request.json();
    
    // Use the single, consistent SDK here:
    const genAI = new GoogleGenAI({ apiKey: apiKey }); 
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // ... (rest of your logic to generate prompt and content) ...
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new Response(JSON.stringify({ insights: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    // ... (catch block) ...
  }
}
