import type { Ollama } from '../types/ollama';

export type LLMConfig = {
  model: 'mistral' | 'codellama' | 'llama';
  ollama_url: string;
};

export default class OllamaAi {
  constructor(
    private config: LLMConfig = {
      model: 'mistral',
      ollama_url: 'http://localhost:11434',
    },
  ) {}

  private async request(
    path: `/api/${string}`,
    config: {
      method: 'get' | 'post';
      body?: Ollama.RequestBody;
    } = {
      method: 'get',
    },
  ) {
    const request: RequestInit = {
      method: config.method.toUpperCase(),
    };

    const url = new URL(path, this.config?.ollama_url);

    // Add the encoded body
    if (config.method !== 'get' && config.body) {
      try {
        request.body = JSON.stringify(config.body);
      } catch (err) {
        throw new TypeError('body must be valid JSON');
      }
    }

    console.log('sending request to: %s', url);
    console.log('body: %s', request?.body);

    const response = await fetch(url, request);
    return response.json();
  }

  async chat(messages: Message[], options?: Ollama.ChatRequestBody['options']) {
    const chatBody: Ollama.ChatRequestBody = {
      options,
      model: this.config.model,
      stream: false,
      messages: messages.map((m) => ({
        content: m.body,
        role: m.role,
      })),
    };

    const res = (await this.request('/api/chat', {
      method: 'post',
      body: chatBody,
    })) as Ollama.ChatResponseBody;

    return res.message.content;
  }
}

export type MessageConfig = {
  text: string;
  role: 'user' | 'system' | 'assistant';
};

export class Message {
  constructor(private config: MessageConfig) {}

  get body() {
    return this.config.text;
  }

  get role() {
    return this.config.role;
  }

  toJSON() {
    return {
      text: this.config.text,
      role: this.config.role,
    };
  }
}

export class SystemMessage extends Message {
  constructor(text: string) {
    super({ text, role: 'system' });
  }
}

export class HumanMessage extends Message {
  constructor(text: string) {
    super({ text, role: 'user' });
  }
}

export class AIMessage extends Message {
  constructor(text: string) {
    super({ text, role: 'assistant' });
  }
}
