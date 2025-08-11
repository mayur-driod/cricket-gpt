import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionsRow = ({ onPromptClick }) => {
  const prompts = [
    "Who is the captain of the Indian cricket team in T20Is?",
    "Who holds the record for the fastest century in ODI cricket?",
    "What is the highest individual score in a Test match?",
    "Who is currently ranked No.1 in the ICC Men's ODI batting rankings?",
  ];

  return (
    <div className="prompt-suggestions-row">
      {prompts.map((prompt, index) => (
        <PromptSuggestionButton
          key={`suggestion-${index}`}
          onClick={() => onPromptClick(prompt)}
          text={prompt}
        />
      ))}
    </div>
  );
};

export default PromptSuggestionsRow;
