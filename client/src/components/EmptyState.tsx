interface EmptyStateProps {
  onSuggestion: (prompt: string) => void;
}

const SUGGESTIONS = [
  'What fillet sizes do you offer?',
  'Do you ship to Canada?',
  'What certifications do your products have?',
  'I want to order 20 boxes of 10kg medium fillets',
];

export const EmptyState = ({ onSuggestion }: EmptyStateProps): JSX.Element => {
  return (
    <div className="empty-state">
      <span className="empty-logo">
        <img src="/bluecrown-crown.svg" alt="Blue Crown Seafood logo" />
      </span>
      <h2>Welcome to Blue Crown Seafood</h2>
      <p>
        Ask about our premium frozen Basa fillets, shipping and certifications — or place an
        order request right here in the chat.
      </p>
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
