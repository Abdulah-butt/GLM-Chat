import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

const MAX_INPUT_LENGTH = 8000;

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps): JSX.Element => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = (): void => {
    const trimmed = value.trim();
    if (trimmed === '' || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current !== null) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const handleInput = (): void => {
    const textarea = textareaRef.current;
    if (textarea === null) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Ask anything…"
        rows={1}
        maxLength={MAX_INPUT_LENGTH}
        aria-label="Chat message"
      />
      <button type="submit" disabled={disabled || value.trim() === ''} aria-label="Send message">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M3.4 20.4 20.85 12.9c.8-.35.8-1.45 0-1.8L3.4 3.6c-.65-.3-1.4.2-1.4.9v5.1c0 .5.35.9.85 1L13 12 2.85 13.4c-.5.1-.85.5-.85 1v5.1c0 .7.75 1.2 1.4.9Z" />
        </svg>
      </button>
    </form>
  );
};
