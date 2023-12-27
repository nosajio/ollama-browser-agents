export type BaseAssistant = {
  name: string;
  sysPrompt: string;
  active: boolean;
  opts?: AssistantOptions;
};

export type AssistantOptions = {
  expectBoolean?: boolean;
  useLLMChat?: boolean;
  includeSearchEngines?: boolean;
};
