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
          content: "You're a hype gaming commentator calling a friendly match between Roblox players. Think sports commentator energy mixed with gamer humor. Be entertaining, use natural language, crack jokes, make references to their stats in creative ways. Keep it playful and fun - like commentary your friends would laugh at. No corporate-speak or robotic analysis. Choose the player who has been grinding more or has more badges, do a badge to grinding ratio"
        },
        {
          role: "user",
          content: `Alright, we got ${player1.username} vs ${player2.username}!

${player1.username} has been grinding for ${player1.accountAgeDays} days, snagged ${player1.badgeCount} badges, ${player1.hasVerifiedBadge ? 'and yeah they got that verified checkmark' : "but no verified badge yet"}.

Meanwhile ${player2.username} is sitting at ${player2.accountAgeDays} days played, ${player2.badgeCount} badges collected, ${player2.hasVerifiedBadge ? 'plus they got verified' : "still waiting on that verification"}.

Who takes this W? Give me the commentary!`
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
