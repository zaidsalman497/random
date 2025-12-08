import { Handler } from "@netlify/functions";
import fs from "fs";
import path from "path";

// In-memory session storage (resets when function cold-starts)
const sessions = new Map<string, any>();

export const handler: Handler = async (event) => {
  const sessionId = event.queryStringParameters?.sessionId || 'default';

  if (event.httpMethod === 'GET') {
    // Serve the game HTML with session-specific modifications
    const baseGamePath = path.join(process.cwd(), "public", "dino-game.html");
    let gameCode = fs.readFileSync(baseGamePath, "utf-8");

    // Get session modifications
    const sessionData = sessions.get(sessionId);

    if (sessionData) {
      // Apply modifications from session
      if (sessionData.config) {
        for (const [key, value] of Object.entries(sessionData.config)) {
          const isString = typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb'));
          const valStr = isString ? `'${value}'` : String(value);
          // Escape special regex characters in key
          const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const re = new RegExp(`(${escapedKey}\\s*:\\s*)([^,}\\n]+)`, 'g');
          gameCode = gameCode.replace(re, `$1${valStr}`);
        }
      }

      if (sessionData.obstacleTypes && sessionData.obstacleTypes.length > 0) {
        const obstaclesStr = sessionData.obstacleTypes.map((o: any) => JSON.stringify(o)).join(',\n        ');
        const re = /obstacleTypes:\s*\[([\s\S]*?)\]/;
        gameCode = gameCode.replace(re, `obstacleTypes: [\n        ${obstaclesStr}\n      ]`);
      }

      if (sessionData.powerUps && sessionData.powerUps.length > 0) {
        const powerUpsStr = sessionData.powerUps.map((p: any) => JSON.stringify(p)).join(',\n        ');
        const re = /powerUps:\s*\[([\s\S]*?)\]/;
        gameCode = gameCode.replace(re, `powerUps: [\n        ${powerUpsStr}\n      ]`);
      }

      if (sessionData.customCode) {
        const re = /\/\/ CUSTOM_CODE_START[\s\S]*?\/\/ CUSTOM_CODE_END/;
        gameCode = gameCode.replace(re, `// CUSTOM_CODE_START\n    ${sessionData.customCode}\n    // CUSTOM_CODE_END`);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: gameCode,
    };
  } else if (event.httpMethod === 'POST') {
    // Update session data
    const body = JSON.parse(event.body || '{}');
    sessions.set(sessionId, body.sessionData);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } else if (event.httpMethod === 'DELETE') {
    // Clear session
    sessions.delete(sessionId);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
