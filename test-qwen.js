const { OpenAI } = require("openai");

async function main() {
  const openai = new OpenAI({
    baseURL: "http://localhost:11434/v1",
    apiKey: "ollama",
  });
  
  const systemPrompt = `Devuelve solo JSON con "title", "summary", "content", "imageCaption". Usa español.`;
  const userPrompt = `Escribe un articulo muy corto sobre cripto.`;

  console.log("LLamando a ollama...");
  const t0 = Date.now();
  
  try {
    const response = await openai.chat.completions.create({
      model: "qwen2.5:14b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
    });
    
    console.log("TIME:", (Date.now() - t0)/1000, "s");
    console.log(response.choices[0].message.content);
  } catch(e) {
    console.error("ERROR:", e);
  }
}

main();
