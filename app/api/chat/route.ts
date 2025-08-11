import OpenAI from "openai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import "dotenv/config";

const {
  ASTRA_DB_KEYSPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openAi = new OpenAI({ apiKey: OPENAI_API_KEY });

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_KEYSPACE });

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const messages = requestBody.messages;
    const latestMessage = messages[messages.length - 1];

    let docContext = "";

    const embedding = await openAi.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage.content,
      encoding_format: "float",
    });
    
    try {
        const collection = await db.collection(ASTRA_DB_COLLECTION);
        const cursor = collection.find(null, {
            sort: {
                $vector: embedding.data[0].embedding,
            },
            limit: 10,
        });

        const documents = await cursor.toArray();
        const docMaps = documents?.map(doc => doc.text);
        docContext = JSON.stringify(docMaps);
    } catch (error) {
        console.error(`Error querying database: ${error}`);
    }

    const template = {
        role: "system",
        content: `You are an AI assistant who knows everything about Formula One.
        Use the below context to augment what you know about Formula One racing.
        The context will provide you with the most recent page data from wikipedia,
        the official F1 website and others.
        If the context doesn't include the information you need answer based on your
        existing knowledge and don't mention the source of your information or
        what context does or doesn't include.
        Format responses using markdown where applicable and don't return images.
        ---------------
        START CONTEXT
        ${docContext}
        END CONTEXT
        ---------------
        Question: ${latestMessage}
        `,
    };

    const response = await openAi.chat.completions.create({
        model: "gpt-4",
        messages: [template, ...messages],
        stream: true,
    });

    // Convert the stream to a readable stream
    const stream = new ReadableStream({
        async start(controller) {
            for await (const chunk of response) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                }
            }
            controller.close();
        },
    });

    // Return a standard Response object with the stream
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
        },
    });

  } catch (error) {
    console.error(`Error processing request: ${error}`);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: {
            'Content-Type': 'application/json',
        },
    });
  }
}