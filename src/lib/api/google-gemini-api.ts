/**
 * Google Gemini API for image generation
 * Uses the direct REST API for image generation capabilities
 */
export class GoogleGeminiAPI {
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(
    prompt: string,
    _model = "gemini-2.0-flash-preview-image-generation",
    _options?: {
      numberOfImages?: number;
      aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
    },
  ): Promise<{ data: Array<{ url: string }> }> {
    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    };

    const response = await fetch(
      `${this.baseUrl}/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API error details:", errorText);
      throw new Error(
        `Google Gemini API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = (await response.json()) as {
      candidates: Array<{
        content: {
          parts: Array<{
            text?: string;
            inlineData?: { mimeType: string; data: string };
          }>;
        };
      }>;
    };

    const images: Array<{ url: string }> = [];

    for (const candidate of result.candidates ?? []) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          images.push({ url: dataUrl });
        }
      }
    }

    if (images.length === 0) {
      throw new Error("No images generated in response");
    }

    return { data: images };
  }
}
