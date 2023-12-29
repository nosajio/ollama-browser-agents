export type AgentColor = 'blue' | 'green' | 'red' | 'purple' | 'yellow';

export type BaseAgent = {
  name: string;
  sysPrompt: string;
  active: boolean;
  color: AgentColor;
  opts?: AgentOptions;
};

export type AgentOptions = {
  expectBoolean?: boolean;
  useLLMChat?: boolean;
  includeSearchEngines?: boolean;
};

export type AgentResponse = {
  agentName: string;
  response?: string | boolean;
  url: string;
  time: Date;
};

export type ExtensionOptions = {
  ollamaUrl: string;
  model: string;
};
