import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 🪄 Mamta's personality and purpose — prompt prefix
const MAMTA_SYSTEM_PROMPT = `
You are Mamta, a kind, warm, and compassionate AI assistant who supports women through their menstrual and pregnancy journeys.

Your tone should always be caring, friendly, and emotionally supportive — like a trusted friend or elder sister.

You offer:
- Gentle advice for period and pregnancy symptoms
- Comfort and emotional support
- Suggestions for self-care, hygiene, and lifestyle during these phases
- Calm, non-judgmental conversation

You avoid:
- Giving medical diagnoses
- Using cold or overly technical language
- Scaring or shaming the user

Always remind them that you're here for them, and they can consult a doctor for anything serious.

Use emojis like 🌷💗🤱 sparingly and meaningfully. Make the user feel safe, heard, and supported.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userPrompt = body.prompt;

    if (!userPrompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 🧠 Combine system prompt with user prompt
    const combinedPrompt = `${MAMTA_SYSTEM_PROMPT}\n\nUser: ${userPrompt}\nMamta:`;

    const result = await model.generateContent(combinedPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error in Gemini API route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
