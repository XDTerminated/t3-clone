// HACK: Manual type definition to avoid client-side import issues
export type UploadFileResponse<T = unknown> = {
  name: string;
  size: number;
  key: string;
  url: string;
  serverData: T;
};

export interface ChatMessage {
  message: string;
  searchEnabled?: boolean;
  files?: UploadFileResponse[];
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
}
