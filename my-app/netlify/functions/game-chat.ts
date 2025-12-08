import { Handler } from "@netlify/functions";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const tools = [
  {
    type: "function" as const,
    function: {
      name: "modify_game_property",
      description: "Modify a game property like dino color, jump power, game speed, obstacle size/spawn, background/ground colors, and more.",
      parameters: {
        type: "object",
        properties: {
          property: {
            type: "string",
            description: "The property to modify. Prefer these keys: 'dino.color', 'gravity', 'gameSpeed', 'jumpPower', 'background', 'groundColor', 'obstacle.color', 'obstacle.spawnRate', 'obstacle.width', 'obstacle.height', 'doubleJump'",
          },
          value: {
            type: "string",
            description: "The new value (e.g., '#0000ff' for blue, '5' for speed)",
          },
        },
        required: ["property", "value"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_obstacle_type",
      description: "Add a new obstacle type to the game with custom properties. This creates variety - obstacles will be randomly chosen from all types.",
      parameters: {
        type: "object",
        properties: {
          width: {
            type: "number",
            description: "Width of the obstacle (e.g., 30, 60)",
          },
          height: {
            type: "number",
            description: "Height of the obstacle (e.g., 40, 80)",
          },
          color: {
            type: "string",
            description: "Color as hex code (e.g., '#ff0000')",
          },
          shape: {
            type: "string",
            description: "Shape type: 'rect', 'circle', or 'triangle'",
            enum: ["rect", "circle", "triangle"],
          },
          y: {
            type: "number",
            description: "Y position (170 is ground level, lower numbers are higher)",
          },
          bounceSpeed: {
            type: "number",
            description: "If set, obstacle bounces vertically (e.g., 8 for bouncing)",
          },
        },
        required: ["width", "height", "color", "shape"],
      },
    },
  },
];

const handler: Handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { messages } = body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a creative game developer assistant for a Dino Runner game!

**Be Creative!** When users ask for things like "add random obstacles" or "make it more interesting":
- Add multiple obstacle types with different shapes (circles, triangles, rectangles)
- Vary sizes, colors, and heights
- Add bouncing obstacles (use bounceSpeed parameter)
- Mix tall obstacles, short obstacles, flying obstacles (higher Y values)

**Tools:**
1. modify_game_property - Change basic settings
2. add_obstacle_type - Add NEW varied obstacle types

**Examples:**
- "Add random obstacles" -> Create 3-5 different obstacle types with varied shapes/sizes/colors
- "Make obstacles bounce" -> Add obstacles with bounceSpeed: 8
- "Add flying obstacles" -> Create obstacles with y: 120
- "Make it harder" -> Increase speed, add more obstacle variety

Always be creative and add variety!`,
        },
        ...(Array.isArray(messages) ? messages : []),
      ],
      tools: tools,
    });

    const assistantMessage = response.choices[0].message;
    let gameModified = false;
    const summaries: string[] = [];

    if ((assistantMessage as any).tool_calls) {
      const gamePath = path.join(process.cwd(), "public", "dino-game.html");
      let gameCode = fs.readFileSync(gamePath, "utf-8");

      for (const toolCall of (assistantMessage as any).tool_calls) {
        const args = JSON.parse(toolCall.function.arguments || "{}");

        if (toolCall.function.name === "add_obstacle_type") {
          // Add a new obstacle type to the obstacleTypes array
          const obstacleType = {
            width: args.width || 50,
            height: args.height || 50,
            color: args.color || '#ff5252',
            y: args.y || 170,
            shape: args.shape || 'rect',
            bounceSpeed: args.bounceSpeed || 0
          };

          const obstacleStr = JSON.stringify(obstacleType);
          const re = /obstacleTypes:\s*\[([\s\S]*?)\]/;
          const match = gameCode.match(re);
          if (match) {
            const currentArray = match[1].trim();
            const newArray = currentArray ? `${currentArray},\n        ${obstacleStr}` : obstacleStr;
            gameCode = gameCode.replace(re, `obstacleTypes: [\n        ${newArray}\n      ]`);
            summaries.push(`Added ${args.shape} obstacle (${args.width}x${args.height}, ${args.color})`);
            gameModified = true;
          }
        } else if (toolCall.function.name === "modify_game_property") {

          // Helper to set CONFIG.* safely
          const setConfigValue = (key: string, rawValue: string, isString: boolean) => {
            const value = isString ? `'${rawValue}'` : rawValue;
            const re = new RegExp(`(${key}\\s*:\\s*)([^,}]+)`, '');
            if (re.test(gameCode)) {
              gameCode = gameCode.replace(re, `$1${value}`);
              return true;
            }
            return false;
          };

          const prop = String(args.property || '').toLowerCase();
          const val = String(args.value || '');

          // Map common requests to CONFIG keys
          const applied: string[] = [];
          const apply = (key: string, value: string, isString: boolean) => {
            if (setConfigValue(key, value, isString)) applied.push(`${key}=${value}`);
          };

          if (prop === 'dino.color' || prop === 'dinocolor' || prop === 'dino_colour') {
            apply('dinoColor', val, true);
          } else if (prop === 'gravity') {
            apply('gravity', val, false);
          } else if (prop === 'gamespeed' || prop === 'game.speed' || prop === 'speed') {
            apply('gameSpeed', val, false);
          } else if (prop === 'jump' || prop === 'jumppower' || prop === 'dino.dy') {
            apply('jumpPower', val, false);
          } else if (prop === 'background' || prop === 'backgroundcolor' || prop === 'bg') {
            apply('background', val, true);
          } else if (prop === 'ground' || prop === 'groundcolor') {
            apply('groundColor', val, true);
          } else if (prop === 'obstacle.color' || prop === 'obstaclecolor') {
            apply('obstacleColor', val, true);
          } else if (prop === 'obstacle.spawnrate' || prop === 'spawnrate' || prop === 'spawn') {
            apply('obstacleSpawnRate', val, false);
          } else if (prop === 'obstacle.width') {
            apply('obstacleWidth', val, false);
          } else if (prop === 'obstacle.height') {
            apply('obstacleHeight', val, false);
          } else if (prop === 'doublejump') {
            // normalize boolean values
            const boolVal = /^(true|1|on|yes)$/i.test(val) ? 'true' : 'false';
            apply('doubleJump', boolVal, false);
          }

          // Backwards-compatible fallbacks for old patterns if CONFIG not found
          if (applied.length === 0) {
            if (prop.includes('dino') && prop.includes('color')) {
              gameCode = gameCode.replace(/color: '\\#[0-9a-fA-F]+'|color: '\\#[0-9a-fA-F]{3,6}'|color: '[^']+'/, `color: '${val}'`);
              applied.push(`dino.color='${val}'`);
            } else if (prop.includes('gravity')) {
              gameCode = gameCode.replace(/let gravity = [\\d.]+/, `let gravity = ${val}`);
              applied.push(`gravity=${val}`);
            } else if (prop.includes('speed')) {
              gameCode = gameCode.replace(/let gameSpeed = [\\d.]+/, `let gameSpeed = ${val}`);
              applied.push(`gameSpeed=${val}`);
            } else if (prop.includes('jump')) {
              gameCode = gameCode.replace(/dino\\.dy = -?[\\d.]+/, `dino.dy = ${val}`);
              applied.push(`jumpPower=${val}`);
            } else if (prop.includes('obstacle') && prop.includes('color')) {
              gameCode = gameCode.replace(/color: '\\#ff5252'/g, `color: '${val}'`);
              applied.push(`obstacle.color='${val}'`);
            }
          }

          if (applied.length > 0) {
            gameModified = true;
            summaries.push(`Updated ${applied.join(', ')}`);
          }
        }
      }

      // Write the modified game code once after all tool calls
      if (gameModified) {
        fs.writeFileSync(gamePath, gameCode);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: assistantMessage.content || (summaries.length ? `${summaries.join('; ')}.` : "Done! Check your game!"),
        gameModified,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to chat with AI" }),
    };
  }
};

export { handler };
