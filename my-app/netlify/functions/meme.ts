import { Handler } from "@netlify/functions";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const handler: Handler = async () => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: "Generate a funny gaming meme in one sentence" }],
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ meme: response.choices[0].message.content }),
  };
};

export { handler };
