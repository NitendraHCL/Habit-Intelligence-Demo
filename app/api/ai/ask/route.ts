import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { question, cardTitle, cardData, cardDescription, kamComments, conversationHistory } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are HabitAI, an intelligent analytics assistant for a corporate health & wellness platform called Habit Intelligence.

ABBREVIATIONS: AHC = Annual Health Checks, OHC = Occupational Health Centre, NPS = Net Promoter Score, LSMP = Lifestyle Management Program, KAM = Key Account Manager.

You are answering questions EXCLUSIVELY about a specific dashboard chart/card titled "${cardTitle}".
${cardDescription ? `\nChart description: ${cardDescription}` : ""}

The data for this chart is:
${JSON.stringify(cardData, null, 2)}
${kamComments && Array.isArray(kamComments) && kamComments.length > 0 ? `
KEY ACCOUNT MANAGER (KAM) COMMENTS:
The following are expert comments from the HCL Key Account Manager who manages this corporate wellness program. These provide valuable domain context and professional insights.
${kamComments.map((c: { author: string; date: string; text: string }) => `- [${c.author}, ${c.date}]: ${c.text}`).join("\n")}

IMPORTANT: When KAM comments are available, you MUST reference them in your answers. Cite the KAM's observations to support your analysis (e.g. "As noted by the Key Account Manager..."). If the KAM comment directly addresses the user's question, lead with that insight and build upon it with supporting data.
` : ""}
STRICT RULES:
- You MUST only answer based on the data provided above for this specific chart.
- If the user asks about anything not visible in this chart's data, respond: "That information isn't available in this chart. You can find it on the relevant dashboard page."
- Do NOT make up numbers, trends, or insights that are not directly supported by the data above.
- Be concise and actionable. Keep responses under 200 words.
- Reference specific numbers from the data.
- Suggest concrete actions when appropriate.
- Use plain language, avoid jargon.
- Use rich markdown formatting: **bold** for key numbers and emphasis, *italic* for secondary emphasis, bullet points (- item) for lists, and ### headers to organize longer answers.
- Structure responses with bullet points when listing multiple insights or actions.
- When the user first opens the panel, if they ask "what is this chart" or similar, explain what this chart shows based on the title, description, and data structure.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Build conversation history for multi-turn context
    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          contents.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          });
        }
      }
    }

    contents.push({ role: "user", parts: [{ text: question }] });

    const result = await model.generateContent({
      contents,
      systemInstruction: { role: "user" as const, parts: [{ text: systemPrompt }] },
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.7,
      },
    });

    const text = result.response.text();

    return NextResponse.json({ answer: text });
  } catch (error) {
    console.error("AI Ask error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}
