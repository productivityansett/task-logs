import { GoogleGenAI } from "@google/genai";
import type { ProductivityLog } from '../types';

// This function will be deployed as a Vercel Serverless Function
export default async function handler(request: Request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Securely get the API key from server-side environment variables
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    const errorBody = { 
      error: 'API Key Not Found', 
      details: 'The API_KEY environment variable is not configured correctly in the Vercel project settings.' 
    };
    return new Response(JSON.stringify(errorBody), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data: ProductivityLog[] = await request.json();
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    const simplifiedData = data.slice(0, 50).map(({ employeeName, department, taskCategory, taskStatus, hours, productivityRating, blockers }) => 
        ({ employeeName, department, taskCategory, taskStatus, hours, productivityRating, blockers: blockers || 'None' })
    );

    const prompt = `
      You are a senior business analyst and HR strategist reviewing weekly productivity logs for a corporate team.
      Based on the following data, provide a concise summary in markdown format for leadership.

      The summary must focus on business development and employee management insights. It should include:
      1.  **Executive Summary:** A high-level overview of the team's weekly performance and its impact on business goals.
      2.  **Performance Highlights & Areas for Improvement:** Identify top-performing employees or departments that are driving results. Also, pinpoint potential bottlenecks or where productivity is lagging.
      3.  **Strategic Recommendations for Management:** Provide 2-3 clear, actionable recommendations. One should focus on process improvements for business development, and one should focus on employee management (e.g., training needs, recognition, workload balancing).

      Maintain a strategic, data-driven tone. Do not exceed 200 words.

      Data:
      ${JSON.stringify(simplifiedData, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    
    return new Response(JSON.stringify({ insights: response.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in serverless function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: 'Failed to generate insights.', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
