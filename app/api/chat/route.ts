import { GoogleGenAI } from "@google/genai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import "dotenv/config";

const {
  ASTRA_DB_KEYSPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  GEMINI_API_KEY,
} = process.env;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_KEYSPACE });

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const messages = requestBody.messages;
    const latestMessage = messages[messages.length - 1];

    let docContext = "";

    // Use the same embedding model (768-dim) as loadDb.ts
    const embedResponse = await ai.models.embedContent({
      model: "gemini-embedding-001", //  matches DB schema
      contents: [{ role: "user", parts: [{ text: latestMessage.content }] }],
    });

    const vector = embedResponse.embeddings[0].values;

    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION);
      const cursor = collection.find(null, {
        sort: { $vector: vector },
        limit: 10,
      });

      const documents = await cursor.toArray();
      const docMaps = documents?.map((doc) => doc.text);
      docContext = JSON.stringify(docMaps);
    } catch (error) {
      console.error(`Error querying database: ${error}`);
    }

    const firstUserPrompt = `You are an AI assistant who knows everything about cricket.
Use the below context to augment your knowledge.
The context provides the most recent page data from Wikipedia and other cricket sources.
If the context doesn't have what you need, answer based on your own knowledge.
Don't mention the source of information or if context is missing.
Format with markdown where applicable, no images.
---------------
START CONTEXT
${docContext}
END CONTEXT
---------------
Question: ${latestMessage.content}`;

    const completion = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        { role: "user", parts: [{ text: firstUserPrompt }] },
        ...messages.map((m) => ({
          role: m.role,
          parts: [{ text: m.content }],
        })),
      ],
    });

    return new Response(completion.response.text(), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error(`Error processing request: ${error}`);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}