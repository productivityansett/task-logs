import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProductivityLog } from "../types";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "API Key Missing",
        details: "Set GEMINI_API_KEY in your Vercel environment variables.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const data: ProductivityLog[] = await request.json();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const simplifiedData = data.slice(0, 50).map(
      ({
        employeeName,
        department,
        taskCategory,
        taskStatus,
        hours,
        productivityRating,
        blockers,
      }) => ({
        employeeName,
        department,
        taskCategory,
        taskStatus,
        hours,
        productivityRating,
        blockers: blockers || "None",
      })
    );

    const prompt = `
      You are a senior business analyst and HR strategist reviewing weekly productivity logs for a corporate team.
      Based on the following data... (your original prompt here)
      
      Data:
      ${JSON.stringify(simplifiedData, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new Response(JSON.stringify({ insights: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Serverless Function Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate insights",
        details: error.message ?? String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
