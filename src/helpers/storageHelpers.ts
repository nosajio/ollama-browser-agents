import { BaseAgent } from '../types/schema';
import { assertBaseAgentArray } from './dataHelpers';

/**
 * Upsert an agent into storage. Agent name must be unique
 */
export async function upsertAgent(
  agent: BaseAgent,
  returning?: boolean,
): Promise<BaseAgent[] | void> {
  const persisted = await chrome.storage.local.get('agents');
  assertBaseAgentArray(persisted.agents);
  const { agents } = persisted;

  // Ensure name is unique
  if (agents.find((a: BaseAgent) => a.name === agent.name)) {
    if (returning) return agents;
    return void 0;
  }
  // Add the agent
  agents.push(agent);
  await chrome.storage.local.set({ agents: agents });
  if (returning) {
    return agents as BaseAgent[];
  }
}

export async function replaceAgents(agents: BaseAgent[]) {
  await chrome.storage.local.set({ agents });
}

export async function getStoredAgents() {
  return new Promise<BaseAgent[]>((resolve) => {
    chrome.storage.local.get('agents', (persisted) => {
      resolve((persisted?.agents || []) as BaseAgent[]);
    });
  });
}
