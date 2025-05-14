import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    // Accept both prompt and uploaded data (CSV or JSON as string)
    const body: unknown = await req.json();
    let prompt = "";
    let userData = "";
    if (typeof body === "object" && body !== null) {
      if (
        "prompt" in body &&
        typeof (body as { prompt: unknown }).prompt === "string"
      ) {
        prompt = (body as { prompt: string }).prompt;
      }
      if (
        "userData" in body &&
        typeof (body as { userData: unknown }).userData === "string"
      ) {
        userData = (body as { userData: string }).userData;
      }
    }
    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not set in environment." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Compose a robust prompt for Gemini
    let fullPrompt = prompt;
    if (userData) {
      fullPrompt = `You are a Python data analysis assistant. The user has uploaded the following data.\n\nDATA:\n${userData}\n\nPlease generate and run Python code to analyze or visualize this data as requested. Use pandas to load the data. If plotting, use matplotlib. If you generate a chart, save it to a PNG in-memory buffer and print the PNG as a Base64 string prefixed with 'data:image/png;base64,'. If the user asks for a chart, always output the image as base64. If the user asks for a summary or stats, print as JSON. Do not output explanations, just the result.\n\nUSER REQUEST: ${prompt}`;
    }
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: [fullPrompt],
        config: {
          tools: [{ codeExecution: {} }],
        },
      });
    } catch (apiErr) {
      console.log(apiErr);
      // Enhanced error handling for rate limits (429)
      const errMsg = String(apiErr);
      console.log(process.env.GEMINI_API_KEY);
      if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        return new Response(
          JSON.stringify({
            error:
              "The AI service is temporarily unavailable due to rate limits. Please wait a minute and try again.",
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${errMsg}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const parts = response?.candidates?.[0]?.content?.parts ?? [];
    let imageData: string | null = null;
    let chartData: unknown = null;
    for (const part of parts) {
      const output = part?.codeExecutionResult?.output;
      if (typeof output === "string") {
        if (output.includes("data:image")) {
          imageData = output;
        } else {
          try {
            chartData = JSON.parse(output);
          } catch {
            // ignore JSON parse errors
          }
        }
      }
    }
    return new Response(JSON.stringify({ imageData, chartData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Failed to analyze data: ${String(err)}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
