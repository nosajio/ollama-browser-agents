import { useEffect, useRef, useState } from 'react';
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
  agent: { name, sysPrompt, color },
}: AgentProps) {
  return (
    <section className="agent">
      <header className="agent__header">
        <h2 className={`agent__title title-${color}`}>{name}</h2>
        <div className="agent__delete">
          <DeleteIcon onClick={onDelete} />
        </div>
      </header>
      <div className="agent__prompt">{sysPrompt}</div>
      {response && state === 'idle' && <Formatted>{response.response}</Formatted>}
      {state === 'loading' && (
        <div className="agent__response">
          <Loading />
        </div>
      )}
    </section>
  );
}

function Formatted({ children }: { children: string | boolean }) {
  const outputEl = useRef<HTMLDivElement>(null);
  const [showScrollover, setShowScrollover] = useState(false);
  const isBoolean = typeof children === 'boolean';

  useEffect(() => {
    if (!outputEl.current || isBoolean) {
      return;
    }
    const { scrollHeight, parentElement } = outputEl.current;
    if (!parentElement) {
      return;
    }
    const { scrollHeight: parentScrollHeight } = parentElement;
    setShowScrollover(scrollHeight > parentScrollHeight);
  }, [isBoolean]);

  return (
    <div className="agent__response">
      {isBoolean ? (
        <span className="boolean">{children ? 'Yes' : 'No'}</span>
      ) : (
        <>
          <div
            className={`agent__output ${!showScrollover ? 'noscrollover' : ''}`}
            ref={outputEl}
            dangerouslySetInnerHTML={{ __html: children }}
          />
          {showScrollover && <div className="scrollover" />}
        </>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="loading">
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </div>
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
