import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAI from "openai";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import "dotenv/config";

type SimilarityMetrics = "cosine" | "dot_product" | "euclidean"; // Similarity metrics are used to measure the similarity between two vectors.

const {
  ASTRA_DB_KEYSPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openAi = new OpenAI({ apiKey: OPENAI_API_KEY });

const cricketData = [
  "https://en.wikipedia.org/wiki/Cricket",                                          // Overview of the sport :contentReference[oaicite:0]{index=0}
  "https://en.wikipedia.org/wiki/International_cricket",                           // Overview of international formats (Test, ODI, T20I) :contentReference[oaicite:1]{index=1}
  "https://en.wikipedia.org/wiki/International_Cricket_Council",                   // Cricket’s governing body ICC info :contentReference[oaicite:2]{index=2}
  "https://en.wikipedia.org/wiki/Cricket_World_Cup",                               // Men’s Cricket World Cup (ODI format) :contentReference[oaicite:3]{index=3}
  "https://en.wikipedia.org/wiki/2024_Men%27s_T20_World_Cup",                      // 2024 Men’s T20 World Cup details :contentReference[oaicite:4]{index=4}
  "https://en.wikipedia.org/wiki/2026_Men%27s_T20_World_Cup",                      // Upcoming 2026 Men’s T20 World Cup :contentReference[oaicite:5]{index=5}
  "https://en.wikipedia.org/wiki/2025_Women%27s_Cricket_World_Cup",                // 2025 Women’s Cricket World Cup :contentReference[oaicite:6]{index=6}
  "https://en.wikipedia.org/wiki/Under-19_Men%27s_Cricket_World_Cup",              // U19 Men’s Cricket World Cup overview :contentReference[oaicite:7]{index=7}
  "https://en.wikipedia.org/wiki/Lists_of_cricket_records",                        // Extensive lists of cricket records :contentReference[oaicite:8]{index=8}
  "https://en.wikipedia.org/wiki/ICC_Men%27s_Test_Team_Rankings",                  // ICC Test Team Rankings :contentReference[oaicite:9]{index=9}
  "https://en.wikipedia.org/wiki/ICC_Cricket_Hall_of_Fame",                        // ICC Hall of Fame info :contentReference[oaicite:10]{index=10}
  "https://en.wikipedia.org/wiki/History_of_cricket",                             // Historical background of cricket :contentReference[oaicite:11]{index=11}
  "https://en.wikipedia.org/wiki/List_of_International_Cricket_Council_members"   // ICC membership details :contentReference[oaicite:12]{index=12}
];


const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_KEYSPACE });

console.log(`* Connected to DB ${db.id}`);

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512, // Characters in each chunk
  chunkOverlap: 100, // Number of characters to overlap between chunks
});

const createCollection = async (
  similarityMetrics: SimilarityMetrics = "dot_product"
) => {
  const collection: any = await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: {
      dimension: 1536,
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
      const embedding = await openAi.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float",
      });

      const vector = embedding.data[0].embedding;

      const result = await collection.insertOne({
        $vector: vector,
        text: chunk,
      });

      console.log(result);
    }
  }
};

const scrapePage = async (url: string): Promise<string> => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML);
      await browser.close();
      return result;
    },
  });

  return (await loader.scrape())?.replace(/<[^>]*>?/gm, "");
};

createCollection().then(() => loadSampleData());