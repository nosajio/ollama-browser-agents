import type * as Ollama from '../types/ollama';
import { BaseAgent } from '../types/schema';

export type LLMConfig = {
  model: 'mistral' | 'codellama' | 'llama2';
  ollama_url: string;
};

type TrackedRequest = {
  aborter: AbortController;
  url: string;
  key: string;
};

export default class OllamaAi {
  private requests: TrackedRequest[] = [];

  constructor(private config: LLMConfig) {}

  /**
   * Make an abortable request to the OLLAMA API. Pending requests are added to this.requests.
   *
   * Request abort rules
   * ===================
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
    idempotencyKey?: string,
  ) {
    const url = new URL(path, this.config?.ollama_url);

    const getKeyMatch = (
      predicateKey: string,
      predicateUrl: string,
    ): 'full' | 'partial' | 'none' => {
      if (predicateKey === idempotencyKey) {
        if (predicateUrl === url.toString()) {
          return 'full';
        } else {
          return 'partial';
        }
      } else {
        return 'none';
      }
    };

    // Build the new request
    const request: RequestInit = {
      method: config.method.toUpperCase(),
    };

    // Add the aborter and track request
    if (idempotencyKey) {
      // Abort any existing requests with the same key
      const fullMatches = this.requests.filter(({ key, url }) => getKeyMatch(key, url) === 'full');
      const partialMatches = this.requests.filter(
        ({ key, url }) => getKeyMatch(key, url) === 'partial',
      );

      if (partialMatches.length > 0) {
        partialMatches.forEach((r) => {
          r.aborter.abort();
        });
        this.requests = this.requests.filter((r) => !partialMatches.includes(r));
      }
      // When the only pending requests are full matches, exit here and allow
      // those requests complete
      if (fullMatches.length > 0 && partialMatches.length === 0) {
        return;
      }

      // Assign a new aborter
      const aborter = new AbortController();
      this.requests.push({
        url: url.toString(),
        aborter,
        key: idempotencyKey,
      });
      request.signal = aborter.signal;
    }

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

    const response = await fetch(url, request).catch((err) => {
      console.error(err);
    });

    // remove completed request from tracking
    if (idempotencyKey) {
      this.requests = this.requests.filter((r) => r.key !== idempotencyKey);
    }

    return response?.json();
  }

  async chat(messages: Message[], agent: BaseAgent, options?: Ollama.ChatRequestBody['options']) {
    const chatBody: Ollama.ChatRequestBody = {
      options,
      model: this.config.model,
      stream: false,
      messages: messages.map((m) => ({
        content: m.body,
        role: m.role,
      })),
    };

    const res = (await this.request(
      '/api/chat',
      {
        method: 'post',
        body: chatBody,
      },
      agent.name.toLowerCase(),
    )) as Ollama.ChatResponseBody;

    return res.message.content;
  }

  async abortAll() {
    this.requests.forEach((r) => {
      r.aborter.abort();
    });
    this.requests = [];
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
