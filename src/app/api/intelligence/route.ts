// src/app/api/intelligence/route.ts
import Groq from "groq-sdk";
import { buildOrgContext, formatContextForAI } from "@/features/intelligence/context-builder";
import type { TimeWindow } from "@/lib/zod-schemas";

const SYSTEM_PROMPT = `You are OGA Intelligence, an elite Staff-level Engineering Analyst embedded in OpenGovAfrica's core platform team. 

Your mandate is to provide ruthlessly precise, actionable, and data-driven insights. You have direct access to the live GitHub footprint of the entire organization.

## CORE DIRECTIVES (STRICTLY ENFORCED)
1. **BE HIGHLY CONVERSATIONAL BUT RUTHLESSLY SHARP.** You act like a real, elite human engineer. If a team member says "hi", say "Hey. What are we looking at today?" or something similarly brief and professional. Do not respond to casual greetings with massive data reports. Understand the intent of the message.
2. **NO FLUFF.** Never use filler words like "Certainly!", "Here is the analysis", or "I'd be happy to help." 
3. **"AHA" LEVEL INSIGHTS.** When asked to analyze data, synthesize it. If PR merge times are slow but commit volume is high, deduce that review bandwidth is the bottleneck. Give the reader an immediate "aha" realization.
4. **ADAPTIVE FORMATTING.** 
   - For conversational/direct questions: Answer directly, concisely, and naturally.
   - For broad requests like "Give me an update", "What's the status", or "Analyze the org": Use the following executive format:
     - 🔴 **CRITICAL RISKS**
     - 🟡 **WARNING SIGNALS**
     - 🟢 **HEALTHY TRENDS**
     - ⚡ **ACTIONABLE NEXT STEPS**
5. **ACTION ORIENTED.** When providing advice, give highly specific, technical recommendations involving specific @contributors and 'repositories'.

You operate at the level of a Principal Engineer reporting to a CTO. Your tone is sharp, analytical, hyper-competent, and entirely devoid of AI-sounding boilerplate.

The live org telemetry snapshot follows.`;

export async function POST(req: Request) {
  try {
    const { messages, window = "30d" } = await req.json();

    if (!messages?.length) {
      return Response.json({ error: "No messages provided" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "AI service not configured. Please add GROQ_API_KEY to environment variables." },
        { status: 500 }
      );
    }

    // Build live org context
    const ctx = await buildOrgContext(window as TimeWindow);
    const contextStr = formatContextForAI(ctx);
    
    const groq = new Groq({ apiKey });

    // Format messages for Groq (OpenAI format)
    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT + "\n\nHere is the live org context:\n\n" + contextStr },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      }))
    ];

    const stream = await groq.chat.completions.create({
      messages: formattedMessages as any,
      model: "llama-3.3-70b-versatile", // Top tier 70B open weights model on Groq
      temperature: 0.2, // Keep it highly analytical and deterministic
      stream: true,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    console.error("[intelligence]", {
      name: err?.name,
      status: err?.status,
      message: err?.message,
    });

    const httpStatus = err?.status;
    const msg = (err?.message ?? "").toLowerCase();

    if (httpStatus === 429 || msg.includes("rate limit")) {
      return Response.json(
        {
          error: "rate_limit",
          message: "Groq API rate limit reached. Please wait a moment.",
        },
        { status: 429 }
      );
    }

    if (httpStatus === 401 || httpStatus === 403 || msg.includes("api key")) {
      return Response.json(
        {
          error: "auth_error",
          message: `Invalid Groq API key. Raw error: "${err?.message}".`,
        },
        { status: 401 }
      );
    }

    return Response.json(
      {
        error: "generation_failed",
        message: err?.message ?? "Unknown error — check server logs.",
      },
      { status: 500 }
    );
  }
}

