import { Handler } from "@netlify/functions";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const handler: Handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { username, rating, accountAgeDays } = body;

  if (!username || !rating) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "User data required!" })
    };
  }

  try {
    // Create a funny image prompt based on user stats
    const prompt = `A funny cartoon meme about a Roblox player named ${username}.
    They are a "${rating}" level player.
    The meme should show a blocky Roblox character with text overlay making a joke about having ${accountAgeDays} days of playtime.
    Make it colorful, funny, and gaming-themed. No real people, cartoon style only.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid"
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        imageUrl: response.data[0].url
      })
    };

  } catch (error) {
    console.error("Error generating image:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate image" })
    };
  }
};

export { handler };
