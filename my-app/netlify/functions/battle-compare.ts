import { Handler } from "@netlify/functions";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const handler: Handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { player1, player2 } = body;

  if (!player1 || !player2) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Two players required!" })
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a funny gaming commentator who compares two Roblox players. Make it funny but friendly!"
        },
        {
          role: "user",
          content: `Compare these two Roblox players:

Player 1: ${player1.username}
- Account age: ${player1.accountAgeDays} days
- Badges: ${player1.badgeCount}
- Verified: ${player1.hasVerifiedBadge ? "Yes" : "No"}

Player 2: ${player2.username}
- Account age: ${player2.accountAgeDays} days
- Badges: ${player2.badgeCount}
- Verified: ${player2.hasVerifiedBadge ? "Yes" : "No"}

Who's better and why?`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "battle_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              winner: {
                type: "string",
                description: "Username of the winner"
              },
              battleSummary: {
                type: "string",
                description: "Funny comparison summary"
              },
              player1Score: {
                type: "number",
                description: "Score out of 10"
              },
              player2Score: {
                type: "number",
                description: "Score out of 10"
              },
              finishingMove: {
                type: "string",
                description: "A funny finishing line"
              }
            },
            required: ["winner", "battleSummary", "player1Score", "player2Score", "finishingMove"],
            additionalProperties: false
          }
        }
      }
    });

    const battle = JSON.parse(response.choices[0].message.content || "{}");

    return {
      statusCode: 200,
      body: JSON.stringify(battle)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Battle failed!" })
    };
  }
};

export { handler };
