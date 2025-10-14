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
          content: "You're a witty gamer who loves friendly trash talk. Roast Roblox players with creative, playful jokes that feel natural - like something a friend would say while gaming together. Be funny but never mean. Use casual language, gaming slang, and make it feel conversational. Reference their stats in clever ways. Another thing is that badges usually not accurate"
        },
        {
          role: "user",
          content: `Give me a friendly roast for ${username}. They've been playing for ${accountAgeDays} days, collected ${badgeCount} badges, and ${hasVerifiedBadge ? 'somehow got verified' : "aren't even verified"}. Make it sound like casual gamer banter, not robotic.`
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
