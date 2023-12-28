import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Agent } from '../components/agent/Agent';
import { getResponseFromAgents, getTabHTML } from '../helpers/chatHelpers';
import { htmlToMarkdown } from '../helpers/dataHelpers';
import { getStoredAgents, replaceAgents, upsertAgent } from '../helpers/storageHelpers';
import { AgentResponse, type BaseAgent } from '../types/schema';
import './SidePanel.css';

type SidePanelModes = 'new-agent' | 'all';

export default function SidePanel() {
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [uiMode, setUIMode] = useState<SidePanelModes>('all');
  const [allAgents, setAllAgents] = useState<BaseAgent[]>([]);
  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>();
  const apiLock = useRef(false);

  const handleDeleteAgent = (agent: BaseAgent) => {
    const updatedAgents = allAgents.filter((a) => a.name !== agent.name);
    setAllAgents(updatedAgents);
    replaceAgents(updatedAgents);
    setAgentResponses([]);
  };

  const handleSaveAgent = async (agent: BaseAgent) => {
    const updatedAgents = await upsertAgent(agent, true);
    if (!updatedAgents) return;
    setAllAgents(updatedAgents);
    setUIMode('all');
  };

  const getActiveTabMarkdown = async (tabId: number) => {
    const pageHTML = await getTabHTML(tabId);
    if (typeof pageHTML !== 'string') {
      console.error('No page HTML');
      return;
    }
    return htmlToMarkdown(pageHTML);
  };

  const handleUpdateAgents = useCallback(async (tab: chrome.tabs.Tab, agents: BaseAgent[]) => {
    if (apiLock.current || agents.length === 0 || !tab?.id || !tab?.url) return;
    setAgentsLoading(true);
    apiLock.current = true;
    const md = await getActiveTabMarkdown(tab.id);
    if (!md) {
      setAgentsLoading(false);
      apiLock.current = false;
      console.error('No page markdown');
      return;
    }
    const responses = await getResponseFromAgents(agents, { markdown: md, url: tab.url });
    setAgentResponses(responses);
    apiLock.current = false;
    setAgentsLoading(false);
  }, []);

  useEffect(() => {
    const handleTabChanged = (
      _tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab,
    ) => {
      if (changeInfo.status === 'complete') {
        handleUpdateAgents(tab, allAgents);
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
      console.log('stored agents: %o', agents);
      setAllAgents(agents);
      // const currentTab = await chrome.tabs.captureVisibleTab();
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!currentTab?.id || currentTab.status !== 'complete') return;
      handleUpdateAgents(currentTab, agents);
    })();
  }, [handleUpdateAgents]);

  return (
    <main className="panel">
      {uiMode === 'all' && (
        <MainView
          onDeleteAgent={handleDeleteAgent}
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
  onDeleteAgent: (agent: BaseAgent) => void;
};

function MainView({
  onDeleteAgent,
  onModeChange,
  agents,
  agentsLoading,
  responses,
}: MainViewProps) {
  const handleModeChange = (mode: SidePanelModes) => () => {
    onModeChange(mode);
  };

  const handleDelete = (agent: BaseAgent) => {
    onDeleteAgent(agent);
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
        {agents.length === 0 && (
          <button className="button" onClick={handleModeChange('new-agent')}>
            + Add first agent
          </button>
        )}
        <ErrorBoundary fallback={<div>Error with agents</div>} onError={(e) => console.error(e)}>
          {agents.map((a, i) => (
            <Agent
              onDelete={() => handleDelete(a)}
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

    if (!name || !sysPrompt) {
      return;
    }

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
    <form onSubmit={handleSave} className="form">
      <header className="panel__header panel__section">
        <h1 className="title">New Agent</h1>
        <div className="actions">
          <button className="button bg-red" onClick={handleModeChange('all')}>
            Cancel
          </button>
          <button className="button bg-green">Save</button>
        </div>
      </header>
      <section className="panel__main panel__section form-rows">
        <label className="form-row">
          <div className="label">Name</div>
          <input className="input" placeholder="Agent name..." type="text" name="name" required />
        </label>
        <label className="form-row">
          <div className="label">Instruct</div>
          <textarea
            className="input"
            name="sysPrompt"
            placeholder="What should it do?.."
            required
          />
        </label>
        <div className="form-row">
          <div className="label">Settings</div>
          <label className="checkbox">
            <input type="checkbox" name="expectBoolean" />
            <span>Expect Boolean</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" name="includeSearchEngines" />
            <span>Include Search Engines</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" name="useLLMChat" />
            <span>Use LLM Chat</span>
          </label>
        </div>
      </section>
    </form>
  );
}
