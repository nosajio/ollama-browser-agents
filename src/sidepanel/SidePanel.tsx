import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Agent } from '../components/agent/Agent';
import { getResponseFromAgents, getTabHTML } from '../helpers/chatHelpers';
import { htmlToMarkdown } from '../helpers/dataHelpers';
import { getStoredAgents, upsertAgent } from '../helpers/storageHelpers';
import { AgentResponse, type BaseAgent } from '../types/schema';
import './SidePanel.css';

type SidePanelModes = 'new-agent' | 'all';

export default function SidePanel() {
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [uiMode, setUIMode] = useState<SidePanelModes>('all');
  const [allAgents, setAllAgents] = useState<BaseAgent[]>([]);
  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>();
  const apiLock = useRef(false);

  const handleSaveAgent = async (agent: BaseAgent) => {
    console.log('save agent', agent);
    const updatedAgents = await upsertAgent(agent, true);
    if (!updatedAgents) return;
    setAllAgents(updatedAgents);
  };

  const getActiveTabMarkdown = async (tabId: number) => {
    const pageHTML = await getTabHTML(tabId);
    if (typeof pageHTML !== 'string') {
      console.error('No page HTML');
      return;
    }
    return htmlToMarkdown(pageHTML);
  };

  const handleUpdateAgents = useCallback(async (tabId: number, agents: BaseAgent[]) => {
    if (apiLock.current || agents.length === 0) return;
    setAgentsLoading(true);
    apiLock.current = true;
    const md = await getActiveTabMarkdown(tabId);
    if (!md) {
      setAgentsLoading(false);
      apiLock.current = false;
      console.error('No page markdown');
      return;
    }
    const responses = await getResponseFromAgents(agents, md);
    setAgentResponses(responses);
    apiLock.current = false;
    setAgentsLoading(false);
  }, []);

  // const handleUpdateAgent = async (tabId: number, agentName: string) => {
  //   const md = await getActiveTabMarkdown(tabId);
  //   if (!md) return;
  //   const agent = allAgents.find((a) => a.name === agentName);
  //   if (!agent) {
  //     console.error('Update agent: Agent not found');
  //     return;
  //   }
  //   const [response] = await getResponseFromAgents([agent], md);
  //   if (!response) return;
  // };

  useEffect(() => {
    const handleTabChanged = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (changeInfo.status === 'complete') {
        handleUpdateAgents(tabId, allAgents);
      }
    };
    chrome.tabs.onUpdated.addListener(handleTabChanged);
    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabChanged);
    };
  }, [allAgents, handleUpdateAgents]);

  // Get all agents in state on load
  useEffect(() => {
    (async () => {
      const agents = await getStoredAgents();
      console.log('stored agents', agents);
      setAllAgents(agents);
      // const currentTab = await chrome.tabs.captureVisibleTab();
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!currentTab?.id || currentTab.status !== 'complete') return;
      console.log(currentTab);
      handleUpdateAgents(currentTab.id, agents);
    })();
  }, [handleUpdateAgents]);

  return (
    <main className="panel">
      {uiMode === 'all' && (
        <MainView
          onModeChange={setUIMode}
          agents={allAgents}
          responses={agentResponses}
          agentsLoading={agentsLoading}
        />
      )}
      {uiMode === 'new-agent' && <NewAgentView onModeChange={setUIMode} onSave={handleSaveAgent} />}
    </main>
  );
}

type ViewProps = {
  onModeChange: (mode: SidePanelModes) => void;
};

type MainViewProps = ViewProps & {
  agents: BaseAgent[];
  responses?: AgentResponse[];
  agentsLoading?: boolean;
};

function MainView({ onModeChange, agents, agentsLoading, responses }: MainViewProps) {
  const handleModeChange = (mode: SidePanelModes) => () => {
    onModeChange(mode);
  };

  return (
    <>
      <header className="panel__header panel__section">
        <h1 className="title">Agents</h1>
        <button className="button" onClick={handleModeChange('new-agent')}>
          +
        </button>
      </header>
      <section className="panel__main panel__section">
        <ErrorBoundary fallback={<div>Error with agents</div>} onError={(e) => console.error(e)}>
          {agents.map((a, i) => (
            <Agent
              state={agentsLoading ? 'loading' : 'idle'}
              agent={a}
              response={responses?.[i]}
              key={i}
            />
          ))}
        </ErrorBoundary>
      </section>
    </>
  );
}

type NewAgentViewProps = ViewProps & {
  onSave: (agent: BaseAgent) => void;
};

function NewAgentView({ onSave, onModeChange }: NewAgentViewProps) {
  const handleModeChange = (mode: SidePanelModes) => () => {
    onModeChange(mode);
  };

  const handleSave: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const sysPrompt = form.get('sysPrompt') as string;
    const expectBoolean = form.get('expectBoolean') === 'true';
    const includeSearchEngines = form.get('includeSearchEngines') === 'true';
    const useLLMChat = form.get('useLLMChat') === 'true';

    const agent: BaseAgent = {
      active: true,
      name,
      sysPrompt,
      opts: {
        expectBoolean,
        includeSearchEngines,
        useLLMChat,
      },
    };
    onSave(agent);
  };

  return (
    <form onSubmit={handleSave}>
      <header className="panel__header">
        <h1 className="panel__title">New Agent</h1>
        <button className="panel__header-button" onClick={handleModeChange('all')}>
          Cancel
        </button>

        <button className="panel__header-button bg-green">Save</button>
      </header>
      <section className="panel__main">
        <label className="form-row">
          <div className="form-row__label">Name</div>
          <input className="form-row__input" placeholder="Agent name..." type="text" name="name" />
        </label>
        <label className="form-row">
          <div className="form-row__label">Instruct</div>
          <textarea
            className="form-row__input"
            name="sysPrompt"
            placeholder="What should it do?.."
          />
        </label>
        <label className="form-row">
          <div className="form-row__label">Settings</div>
          <label className="form-row__input">
            <input type="checkbox" name="expectBoolean" />
            <span>Expect Boolean</span>
          </label>
          <label className="form-row__input">
            <input type="checkbox" name="includeSearchEngines" />
            <span>Include Search Engines</span>
          </label>
          <label className="form-row__input">
            <input type="checkbox" name="useLLMChat" />
            <span>Use LLM Chat</span>
          </label>
        </label>
      </section>
    </form>
  );
}
