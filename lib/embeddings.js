export async function getEmbedding(text) {
  if (!text) throw new Error("Text is Required");
  const res = await fetch(
    "https://Sadiya025-MedSync-AI-Embedding.hf.space/embed",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Embedding Service Error: ${res.status} ${txt}`);
  }
  const json = await res.json();
  return json.embedding;
}
