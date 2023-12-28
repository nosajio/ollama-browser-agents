import { AgentResponse, BaseAgent } from '../../types/schema';
import './Agent.css';

type AgentProps = {
  agent: BaseAgent;
  response?: AgentResponse;
  state?: 'loading' | 'idle';
};

export function Agent({ response, state = 'idle', agent: { name, sysPrompt } }: AgentProps) {
  return (
    <section className="agent">
      <header className="agent__header">
        <h2 className="agent__title">{name}</h2>
      </header>
      <div className="agent__prompt">{sysPrompt}</div>
      {response && state === 'idle' && <div className="agent__answer">{response.response}</div>}
      {state === 'loading' && <div className="agent__answer">...</div>}
    </section>
  );
}
