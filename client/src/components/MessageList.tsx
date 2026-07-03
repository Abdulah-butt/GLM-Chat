import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const MessageList = ({ messages, isLoading }: MessageListProps): JSX.Element => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div key={message.id} className={`message-row ${message.role}`}>
          {message.role === 'assistant' && (
            <span className="avatar" aria-hidden="true">
              <img src="/bluecrown-crown.svg" alt="" />
            </span>
          )}
          <div className={`bubble ${message.role}`}>{message.content}</div>
        </div>
      ))}
      {isLoading && (
        <div className="message-row assistant">
          <span className="avatar" aria-hidden="true">
            <img src="/bluecrown-crown.svg" alt="" />
          </span>
          <div className="bubble assistant typing" aria-label="Assistant is typing">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
