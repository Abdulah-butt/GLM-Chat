import { useCallback, useRef, useState } from 'react';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { ApiError, sendChatRequest } from './lib/api';
import type { ChatMessage } from './types';

const createId = (): string => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const App = (): JSX.Element => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  const requestReply = useCallback(async (history: ChatMessage[]) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const data = await sendChatRequest(
        history.map(({ role, content }) => ({ role, content })),
      );
      setMessages((current) => [
        ...current,
        { id: createId(), role: 'assistant', content: data.reply.content },
      ]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      pendingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const handleSend = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (trimmed === '' || pendingRef.current) return;
      const nextMessages: ChatMessage[] = [
        ...messages,
        { id: createId(), role: 'user', content: trimmed },
      ];
      setMessages(nextMessages);
      void requestReply(nextMessages);
    },
    [messages, requestReply],
  );

  const handleRetry = useCallback(() => {
    if (messages.length === 0 || messages[messages.length - 1]?.role !== 'user') return;
    void requestReply(messages);
  }, [messages, requestReply]);

  const handleClear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="brand-chip">
            <img src="/kodingklouds-icon.png" alt="KodingKlouds logo" />
          </span>
          <div>
            <h1 className="app-title">KodingKlouds</h1>
            <p className="app-subtitle">AI Chat</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button type="button" className="clear-button" onClick={handleClear} disabled={isLoading}>
            New chat
          </button>
        )}
      </header>

      <main className="chat-area">
        {messages.length === 0 && !isLoading ? (
          <EmptyState onSuggestion={handleSend} />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </main>

      <footer className="chat-footer">
        {error !== null && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button type="button" className="retry-button" onClick={handleRetry}>
              Retry
            </button>
          </div>
        )}
        <ChatInput onSend={handleSend} disabled={isLoading} />
        <p className="footer-note">
          AI responses may be inaccurate. Built by{' '}
          <a href="https://kodingklouds.com" target="_blank" rel="noreferrer">
            KodingKlouds
          </a>
          .
        </p>
      </footer>
    </div>
  );
};
