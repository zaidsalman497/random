import { Handler } from "@netlify/functions";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const handler: Handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { username, accountAgeDays, badgeCount, hasVerifiedBadge } = body;

  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "User data required!" })
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a funny roast comedian who makes jokes about Roblox players. Keep it friendly and funny, not mean!"
        },
        {
          role: "user",
          content: `Roast this Roblox player: ${username}. Their account is ${accountAgeDays} days old, they have ${badgeCount} badges, and ${hasVerifiedBadge ? 'ARE' : 'ARE NOT'} verified.`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "roast_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "A funny roast title"
              },
              mainRoast: {
                type: "string",
                description: "The main roast joke (1-2 sentences)"
              },
              rating: {
                type: "string",
                description: "Noob, Pro, or Legend"
              },
              funFact: {
                type: "string",
                description: "A silly fun fact about the player"
              }
            },
            required: ["title", "mainRoast", "rating", "funFact"],
            additionalProperties: false
          }
        }
      }
    });

    const roast = JSON.parse(response.choices[0].message.content || "{}");

    return {
      statusCode: 200,
      body: JSON.stringify(roast)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate roast" })
    };
  }
};

export { handler };
