# 🏏 CricketGPT — Your AI Cricket Companion

CricketGPT is an interactive AI-powered chatbot built with **Next.js**, **Vercel AI SDK**, and **React** that answers cricket-related questions in real-time.
Whether you’re looking for the latest scores, player stats, ICC rankings, or fun cricket trivia, CricketGPT is here to help — like a digital commentator in your pocket!

---

## 📹 Video Tutorial

🎥 [Watch the Video Tutorial](https://youtu.be/d-VKYF4Zow0?si=chFjGNuiCdrtzaDO)
Based on a FreeCodeCamp project... They built for F1.

---

## 🚀 Features

* **Live cricket knowledge** — Ask about matches, players, rankings, and historic stats.
* **Interactive UI** — Chat bubbles styled with a cricket theme (green fields, scoreboard colors, golden cricket balls).
* **Prompt suggestions** — Quick cricket questions to get you started.
* **Responsive design** — Works seamlessly on desktop and mobile.
* **Customizable backend** — Easily swap in your own cricket API or RAG setup.

---

## 🛠️ Tech Stack

* **Frontend:** React + Next.js
* **AI SDK:** Vercel `ai/react` for chat streaming
* **Styling:** Custom CSS (cricket-themed UI)
* **Deployment:** Vercel
* **Language:** TypeScript

---

## 📂 Project Structure

```
app/
  ├── api/chat/route.ts         # API route for chat
  ├── assets/                   # Static assets (images, icons)
  ├── components/               # Reusable UI components
  │     ├── Bubble.tsx
  │     ├── LoadingBubble.tsx
  │     ├── PromptSuggestionButton.tsx
  │     ├── PromptSuggestionRow.tsx
  ├── global.css                # Global cricket-themed styles
  ├── layout.tsx                # App layout wrapper
  ├── page.tsx                  # Main chat UI

scripts/
  ├── loadDb.ts                  # Optional DB loading script

.env                             # Environment variables
package.json                     # Dependencies and scripts
README.md                        # Documentation
tsconfig.json                    # TypeScript config
```

---

## ⚡ Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/mayur-driod/cricket-gpt.git
cd cricket-gpt
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Add your API keys

Create a `.env` file and add your AI API key ( OpenAI ):

```env
ASTRA_DB_NAMESPACE = "default_keyspace"
ASTRA_DB_COLLECTION="cricketgpt"
ASTRA_DB_API_ENDPOINT=""
ASTRA_DB_APPLICATION_TOKEN=""
OPENAI_API_KEY=""
```

### 4️⃣ Run locally

```bash
npm run dev 
```

Visit: **[http://localhost:3000](http://localhost:3000)**

---

## 💡 How It Works

1. **User asks a cricket-related question.**
2. The message is sent to the AI backend.
3. AI processes the query and returns a relevant answer (can be live data if API integrated).
4. Response is displayed in a **scoreboard-style bubble**.

---

## 🎯 Example Questions

* 🏏 "Who is the current ICC Men’s ODI No. 1 batsman?"
* 📊 "What’s the highest individual Test score?"
* 📅 "When is the next India vs Pakistan match?"
* ⚡ "Who bowled the fastest ball in cricket history?"

---

## 📜 License

This project is licensed under the **MIT License** — free to use and modify.

---

## 🤝 Contributing

Pull requests are welcome! If you’d like to suggest new features or improvements, open an issue.

---

**Built with ❤️ for cricket fans worldwide.**
