interface EmptyStateProps {
  onSuggestion: (prompt: string) => void;
}

const SUGGESTIONS = [
  'Explain how HTTP works in simple terms',
  'Write a haiku about debugging code',
  'What are the pros and cons of TypeScript?',
  'Help me plan a 3-day trip to Tokyo',
];

export const EmptyState = ({ onSuggestion }: EmptyStateProps): JSX.Element => {
  return (
    <div className="empty-state">
      <span className="empty-logo">
        <img src="/kodingklouds-icon.png" alt="KodingKlouds logo" />
      </span>
      <h2>How can I help you today?</h2>
      <p>Send a message to start chatting with the KodingKlouds assistant.</p>
      <div className="suggestions">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="suggestion-chip"
            onClick={() => onSuggestion(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
