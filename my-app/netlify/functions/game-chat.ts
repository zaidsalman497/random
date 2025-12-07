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
          content: `You are a helpful game developer assistant for a Dino Runner.

Use the tool to change properties. Prefer these keys that map to CONFIG in the game's code:
- dino.color (hex color) -> CONFIG.dinoColor
- gravity (number) -> CONFIG.gravity
- gameSpeed (number) -> CONFIG.gameSpeed
- jumpPower (number, negative for higher jump) -> CONFIG.jumpPower
- background (hex color) -> CONFIG.background
- groundColor (hex color) -> CONFIG.groundColor
- obstacle.color (hex color) -> CONFIG.obstacleColor
- obstacle.spawnRate (frames between spawns) -> CONFIG.obstacleSpawnRate
- obstacle.width (number) -> CONFIG.obstacleWidth
- obstacle.height (number) -> CONFIG.obstacleHeight
- doubleJump (true/false) -> CONFIG.doubleJump

Examples:
"Make dino blue" -> {property:"dino.color", value:"#0000ff"}
"Make game super fast" -> {property:"gameSpeed", value:"8"}
"Add double jump" -> {property:"doubleJump", value:"true"}

Always reply with a short friendly description of what changed.`,
        },
        ...(Array.isArray(messages) ? messages : []),
      ],
      tools: tools,
    });

    const assistantMessage = response.choices[0].message;
    let gameModified = false;
    const summaries: string[] = [];

    if ((assistantMessage as any).tool_calls) {
      for (const toolCall of (assistantMessage as any).tool_calls) {
        if (toolCall.function.name === "modify_game_property") {
          const args = JSON.parse(toolCall.function.arguments || "{}");

          const gamePath = path.join(process.cwd(), "public", "dino-game.html");
          let gameCode = fs.readFileSync(gamePath, "utf-8");

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
            fs.writeFileSync(gamePath, gameCode);
            gameModified = true;
            summaries.push(`Updated ${applied.join(', ')}`);
          }
        }
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
