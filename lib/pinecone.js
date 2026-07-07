import { Pinecone } from "@pinecone-database/pinecone";

let pinecone;

export async function getPineconeClient() {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pinecone;
}

export async function queryPinecone(
  vector,
  topK = 3,
  indexName = process.env.PINECONE_INDEX
) {
  const client = await getPineconeClient();
  const index = client.index(indexName);

  const res = await index.query({
    vector,
    topK,
    includeMetadata: true,
    includeValues: false,
  });

  return res.matches || [];
}
