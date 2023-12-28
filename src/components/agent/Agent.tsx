import { AgentResponse, BaseAgent } from '../../types/schema';
import './Agent.css';

type AgentProps = {
  agent: BaseAgent;
  response?: AgentResponse;
  onDelete: () => void;
  state?: 'loading' | 'idle';
};

export function Agent({
  onDelete,
  response,
  state = 'idle',
  agent: { name, sysPrompt },
}: AgentProps) {
  return (
    <section className="agent">
      <header className="agent__header">
        <h2 className="agent__title">{name}</h2>
        <div className="agent__delete">
          <DeleteIcon onClick={onDelete} />
        </div>
      </header>
      <div className="agent__prompt">{sysPrompt}</div>
      {response && state === 'idle' && <div className="agent__response">{response.response}</div>}
      {state === 'loading' && <div className="agent__response">...</div>}
    </section>
  );
}

function DeleteIcon({ onClick }: { onClick?: () => void }) {
  return (
    <svg
      onClick={() => onClick?.()}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="feather feather-trash"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  );
}