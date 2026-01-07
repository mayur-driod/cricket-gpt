import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { GoogleGenAI } from "@google/genai";
// import OpenAI from "openai";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import "dotenv/config";

type SimilarityMetrics = "cosine" | "dot_product" | "euclidean";

const {
  ASTRA_DB_KEYSPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  // OPENAI_API_KEY,
  GEMINI_API_KEY
} = process.env;

// const openAi = new OpenAI({ apiKey: OPENAI_API_KEY });
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const cricketData = [
  "https://en.wikipedia.org/wiki/Cricket",
  "https://en.wikipedia.org/wiki/International_cricket",
  "https://en.wikipedia.org/wiki/International_Cricket_Council",
  "https://en.wikipedia.org/wiki/Cricket_World_Cup",
  "https://en.wikipedia.org/wiki/2024_Men%27s_T20_World_Cup",
  "https://en.wikipedia.org/wiki/2026_Men%27s_T20_World_Cup",
  "https://en.wikipedia.org/wiki/2025_Women%27s_Cricket_World_Cup",
  "https://en.wikipedia.org/wiki/Under-19_Men%27s_Cricket_World_Cup",
  "https://en.wikipedia.org/wiki/Lists_of_cricket_records",
  "https://en.wikipedia.org/wiki/ICC_Men%27s_Test_Team_Rankings",
  "https://en.wikipedia.org/wiki/ICC_Cricket_Hall_of_Fame",
  "https://en.wikipedia.org/wiki/History_of_cricket",
  "https://en.wikipedia.org/wiki/List_of_International_Cricket_Council_members"
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_KEYSPACE });

console.log(`* Connected to DB ${db.id}`);

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const createCollection = async (
  similarityMetrics: SimilarityMetrics = "dot_product"
) => {
  const collection: any = await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: {
      dimension: 768, // Gemini embedding dimension
      metric: similarityMetrics,
    },
  });
  console.log(`* Collection ${collection.id} created`);
  console.log(`Collection Data :- ${JSON.stringify(collection)}`);
};

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION);

  for await (const url of cricketData) {
    const content: string = await scrapePage(url);
    const chunks = await splitter.splitText(content);

    for await (const chunk of chunks) {
      // ----- OpenAI (Commented Out) -----
      // const embedding = await openAi.embeddings.create({
      //   model: "text-embedding-3-small",
      //   input: chunk,
      //   encoding_format: "float",
      // });
      // const vector = embedding.data[0].embedding;

      // ----- Gemini (using @google/genai) -----
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: [{ role: "user", parts: [{ text: chunk }] }],
      });

      const vector = response.embeddings.values;

      await collection.insertOne({
        $vector: vector,
        text: chunk,
      });

      console.log(`Inserted chunk from ${url}`);
    }
  }
};

const scrapePage = async (url: string): Promise<string> => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: { headless: true },
    gotoOptions: { waitUntil: "domcontentloaded" },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML);
      await browser.close();
      return result;
    },
  });

  return (await loader.scrape())?.replace(/<[^>]*>?/gm, "");
};

createCollection().then(() => loadSampleData());