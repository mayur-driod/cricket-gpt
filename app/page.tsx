"use client";

import { useChat, Message } from "ai/react";
import PromptSuggestionsRow from "./components/PromptSuggestionRow";
import LoadingBubble from "./components/LoadingBubble";
import Bubble from "./components/Bubble";

const Home = () => {
  const {
    append,
    isLoading,
    messages,
    input,
    handleInputChange,
    handleSubmit,
  } = useChat();

  const noMessages = !messages || messages.length === 0;

  const handlePrompt = (promptText) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: promptText,
      role: "user",
    };
    append(msg);
  };

  return (
    <main>
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <p className="starter text">
              Welcome to CricketGPT — your ultimate companion for all things
              cricket! Ask anything about matches, player stats, historic
              moments, live scores, or cricket trivia, and get the most
              up-to-date and accurate answers. Let’s hit your questions for a
              six!
            </p>
            <br />
            <PromptSuggestionsRow onPromptClick={handlePrompt} />
          </>
        ) : (
          <>
            {messages.map((message, index) => (
              <Bubble key={`message-${index}`} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
          </>
        )}
      </section>
      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={handleInputChange}
          value={input}
          placeholder="Ask me something about cricket!"
        />
        <input type="submit" />
      </form>
    </main>
  );
};

export default Home;