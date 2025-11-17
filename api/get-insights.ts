import Groq from "groq-sdk";

interface ProductivityLog {
  id: string;
  date: string;
  task: string;
  hoursSpent: number;
  category: string;
  completed: boolean;
  notes?: string;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'GROQ_API_KEY not configured. Please add it to your Vercel environment variables.' 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const data: ProductivityLog[] = await request.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid data: Please provide productivity logs' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Groq with Llama
    const groq = new Groq({ apiKey });

    // Calculate summary statistics
    const totalHours = data.reduce((sum, log) => sum + log.hoursSpent, 0);
    const completedTasks = data.filter(log => log.completed).length;
    const categories = [...new Set(data.map(log => log.category))];
    
    const categoryBreakdown = data.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + log.hoursSpent;
      return acc;
    }, {} as Record<string, number>);

    // Generate comprehensive prompt
    const prompt = `You are a productivity analyst. Analyze the following productivity data and provide actionable insights.

PRODUCTIVITY DATA SUMMARY:
- Total hours logged: ${totalHours}
- Total tasks: ${data.length}
- Completed tasks: ${completedTasks}
- Categories: ${categories.join(', ')}

DETAILED LOGS:
${data.map((log, i) => `${i + 1}. [${log.date}] ${log.task} - ${log.hoursSpent}h (${log.category}) ${log.completed ? '✓' : '○'}${log.notes ? ` - Notes: ${log.notes}` : ''}`).join('\n')}

CATEGORY BREAKDOWN:
${Object.entries(categoryBreakdown).map(([cat, hours]) => `- ${cat}: ${hours}h`).join('\n')}

Please provide:
1. **Key Productivity Patterns**: What trends do you notice in their work habits?
2. **Time Allocation Analysis**: How are they distributing their time across categories?
3. **Completion Rate Insights**: What does the task completion rate indicate?
4. **Recommendations**: 3-5 specific, actionable recommendations to improve productivity
5. **Notable Observations**: Any concerning patterns or positive habits worth highlighting

Format your response in clear sections with headers. Be specific and reference actual data points.`;

    // Generate insights using Llama 3.1 70B
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-70b-versatile", // Meta's Llama 3.1 70B model
      temperature: 0.7,
      max_tokens: 2048,
    });

    const insights = completion.choices[0]?.message?.content || "No insights generated.";

    return new Response(JSON.stringify({ insights }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error('Error generating insights:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate insights',
      details: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}