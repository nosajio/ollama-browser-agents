import type * as Ollama from '../types/ollama';
import { getOptions } from './storageHelpers';

export async function listModels() {
  const { ollamaUrl } = await getOptions();
  const res = (await fetch(`${ollamaUrl}/api/tags`).then((r) => r.json())) as Ollama.ModelsResponse;
  return res;
}

export type LLMConfig = {
  model: string;
  ollama_url: string;
};

export default class OllamaAi {
  private pendingRequests: Map<string, AbortController> = new Map();

  constructor(private config: LLMConfig) {}

  /**
   * Make an abortable request to the OLLAMA API. Pending requests are added to this.requests.
   *
   * ### Request abort rules
   * When the same full key is sent, the new request is ignored.
   * When a different key URL is sent for the same key name, the pending request is cancelled
   */
  private async request(
    path: `/api/${string}`,
    config: {
      method: 'get' | 'post';
      body?: Ollama.RequestBody;
    } = {
      method: 'get',
    },
    cacheKey: string,
  ) {
    const url = new URL(path, this.config?.ollama_url);

    // Build the new request
    const request: RequestInit = {
      method: config.method.toUpperCase(),
    };

    // Add the encoded body
    if (config.method !== 'get' && config.body) {
      try {
        request.body = JSON.stringify(config.body);
      } catch (err) {
        throw new TypeError('body must be valid JSON');
      }
    }

    const currentRequest = this.pendingRequests.get(cacheKey);
    if (currentRequest) {
      currentRequest.abort();
      this.pendingRequests.delete(cacheKey);
    }

    const aborter = new AbortController();
    this.pendingRequests.set(cacheKey, aborter);
    request.signal = aborter.signal;

    const response = await fetch(url, request).catch((err) => {
      if (err.name === 'AbortError') {
        console.log('aborted %s', cacheKey);
        return;
      }
      console.error(err);
    });

    return await response?.json();
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

    try {
      // const keyUrl = new URL(pageUrl);
      const res = (await this.request(
        '/api/chat',
        {
          method: 'post',
          body: chatBody,
        },
        messages[messages.length - 1].body,
      )) as Ollama.ChatResponseBody | undefined;

      if (!res) {
        return undefined;
      }

      return res.message.content;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  abortAll() {
    this.pendingRequests.forEach((controller) => controller.abort());
    this.pendingRequests = new Map();
  }
}

export type MessageConfig = {
  text: string;
  role: 'user' | 'system' | 'agent';
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
    super({ text, role: 'agent' });
  }
}
