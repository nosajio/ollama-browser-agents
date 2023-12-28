export type BaseAgent = {
  name: string;
  sysPrompt: string;
  active: boolean;
  opts?: AgentOptions;
};

export type AgentOptions = {
  expectBoolean?: boolean;
  useLLMChat?: boolean;
  includeSearchEngines?: boolean;
};

export type AgentResponse = {
  agentName: string;
  response: string;
  url: string;
  time: Date;
};
