import { FormEventHandler, useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Agent } from '../components/agent/Agent';
import { abortPendingRequests, getResponseFromAgents, getTabHTML } from '../helpers/chatHelpers';
import { htmlToMarkdown, randomColor } from '../helpers/dataHelpers';
import { getStoredAgents, replaceAgents, upsertAgent } from '../helpers/storageHelpers';
import { AgentResponse, ExtensionOptions, type BaseAgent } from '../types/schema';
import './SidePanel.css';

type SidePanelModes = 'new-agent' | 'all';

export default function SidePanel() {
  const [agentsLoading, setAgentsLoading] = useState<string[]>([]);
  const [uiMode, setUIMode] = useState<SidePanelModes>('all');
  const [allAgents, setAllAgents] = useState<BaseAgent[]>([]);
  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>();
  const [options, setOptions] = useState<ExtensionOptions>();

  const setLoading = (agents: BaseAgent[]) => {
    setAgentsLoading((curr) => [...curr, ...agents.map((a) => a.name)]);
  };
  const setNotLoading = (agents: BaseAgent[]) => {
    setAgentsLoading((curr) => curr.filter((a) => !agents.some((b) => b.name === a)));
  };

  const handleDeleteAgent = (agent: BaseAgent) => {
    // Remove agent from mamory and save
    const updatedAgents = allAgents.filter((a) => a.name !== agent.name);
    setAllAgents(updatedAgents);
    replaceAgents(updatedAgents);
    // Remove agent responses
    setAgentResponses((curr) => curr?.filter((r) => r.agentName !== agent.name));
  };

  const handleSaveAgent = async (agent: BaseAgent) => {
    const updatedAgents = await upsertAgent(agent, true);
    if (!updatedAgents) return;
    setAllAgents(updatedAgents);
    setUIMode('all');
    await updateAgentsForTab([agent]);
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
    if (agents.length === 0 || !tab?.id || !tab?.url) return;

    setLoading(agents);
    const md = await getActiveTabMarkdown(tab.id);
    if (!md) {
      setNotLoading(agents);
      console.error('No page markdown');
      return;
    }
    const responses = await getResponseFromAgents(agents, { markdown: md, url: tab.url });
    const validResponses = responses.filter((r) => r.response !== undefined);
    setAgentResponses((currentResponses) => {
      if (!currentResponses || currentResponses.length === 0) {
        return validResponses;
      }
      // Intersect the new validResponses and currentResponses
      return [
        ...validResponses,
        ...currentResponses.filter(
          (cr) => !validResponses.some((vr) => vr.agentName === cr.agentName),
        ),
      ];
    });
    setNotLoading(agents);
  }, []);

  const updateAgentsForTab = useCallback(
    async (agents: BaseAgent[]) => {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!currentTab?.id || currentTab.status !== 'complete') return;
      handleUpdateAgents(currentTab, agents);
    },
    [handleUpdateAgents],
  );

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

  // Initialise data
  useEffect(() => {
    (async () => {
      const { options } = await chrome.storage.sync.get('options');
      setOptions(options);

      const agents = await getStoredAgents();
      console.log('stored agents: %o', agents);
      setAllAgents(agents);

      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!currentTab?.id || currentTab.status !== 'complete') return;

      await handleUpdateAgents(currentTab, agents);
    })();

    return () => {
      abortPendingRequests();
    };
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
          activeModel={options?.model}
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
  agentsLoading?: string[];
  onDeleteAgent: (agent: BaseAgent) => void;
  activeModel?: string;
};

function MainView({
  activeModel,
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
        {activeModel && <div className="model-tag">{activeModel}</div>}
        <button className="button" onClick={handleModeChange('new-agent')}>
          +
        </button>
      </header>
      <section className="panel__main panel__section">
        {agents.length === 0 && (
          <div className="panel-row">
            <button className="button" onClick={handleModeChange('new-agent')}>
              + Add first agent
            </button>
          </div>
        )}
        <ErrorBoundary fallback={<div>Error with agents</div>} onError={(e) => console.error(e)}>
          {agents.map((a, i) => (
            <Agent
              onDelete={() => handleDelete(a)}
              state={agentsLoading?.includes(a.name) ? 'loading' : 'idle'}
              agent={a}
              response={responses?.find((r) => r.agentName === a.name)}
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
      color: randomColor(),
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
          <button className="button bg-red" onClick={handleModeChange('all')} type="button">
            Cancel
          </button>
          <button className="button bg-green">Save</button>
        </div>
      </header>
      <section className="panel__form panel__section form-rows">
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
            <input type="checkbox" name="expectBoolean" value="true" />
            <span>Expect Boolean</span>
          </label>
          {/* Support these soon */}
          {/* <label className="checkbox">
            <input type="checkbox" name="includeSearchEngines" />
            <span>Include Search Engines</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" name="useLLMChat" />
            <span>Use LLM Chat</span>
          </label> */}
        </div>
      </section>
    </form>
  );
}
