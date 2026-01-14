import type { UploadFileResponse } from "../types";

export interface MessageContent {
  type: "text" | "image_url" | "file";
  text?: string;
  image_url?: { url: string };
  file?: { filename: string; file_data: string };
}

export interface OpenRouterModel {
  id: string;
  name: string;
  contextLength: number;
  provider: string;
  capabilities?: string[]; // e.g. ['vision','search','pdf','reasoning','image']
}

export interface ChatStreamOptions {
  searchEnabled?: boolean;
  files?: UploadFileResponse[];
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | MessageContent[];
  annotations?: Record<string, unknown>;
}

export interface ImageGenerationOptions {
  numberOfImages?: number;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
}

export interface ImageGenerationResult {
  data: Array<{ url: string }>;
}
