export type RequestBody = ChatRequestBody;

export type ChatResponseBody = {
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

export type OllamaMessage = {
  role: 'user' | 'agent' | 'system';
  content: string;
};

export type ChatRequestBody = {
  model: string;
  stream: boolean;
  messages: OllamaMessage[];
  format?: string;
  template?: string;
  options?: {
    temperature?: number;
  };
};

export type ModelsResponse = {
  models: {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
      format: string;
      family: string;
      families: unknown;
      parameter_size: string;
      quantization_level: string;
    };
  }[];
};
