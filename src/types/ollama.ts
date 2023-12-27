export declare module Ollama {
  type RequestBody = ChatRequestBody;

  type ChatResponseBody = {
    model: string;
    created_at: string;
    message: {
      role: string;
      content: string;
    };
    done: boolean;
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
  };

  type OllamaMessage = {
    role: 'user' | 'agent' | 'system';
    content: string;
  };

  type ChatRequestBody = {
    model: string;
    stream: boolean;
    messages: OllamaMessage[];
    format?: string;
    template?: string;
    options?: {
      temperature?: number;
    };
  };
}
