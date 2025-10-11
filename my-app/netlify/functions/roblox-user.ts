import { Handler } from "@netlify/functions";

// Simple in-memory cache to reduce API calls (lasts until function cold starts)
const userCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

const handler: Handler = async (event) => {
  // Get username from URL parameter
  const username = event.queryStringParameters?.username;

  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Username required!" })
    };
  }

  // Normalize username to lowercase for case-insensitive lookup
  const normalizedUsername = username.toLowerCase();

  // Check cache first
  const cached = userCache.get(normalizedUsername);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return {
      statusCode: 200,
      body: JSON.stringify(cached.data)
    };
  }

  try {
    // Step 1: Get user by username (official Roblox API endpoint)
    const searchRes = await fetch(
      `https://users.roblox.com/v1/usernames/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          usernames: [username],
          excludeBannedUsers: false
        })
      }
    );

    if (!searchRes.ok) {
      return {
        statusCode: searchRes.status,
        body: JSON.stringify({ error: "Roblox API error. Try again in a moment." })
      };
    }

    const searchData = await searchRes.json();

    if (!searchData.data || searchData.data.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found! Check spelling and try again." })
      };
    }

    const userId = searchData.data[0].id;

    // Step 2: Get full user details
    const userDetailsRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);

    if (!userDetailsRes.ok) {
      return {
        statusCode: userDetailsRes.status,
        body: JSON.stringify({ error: "Failed to get user details" })
      };
    }

    const userDetails = await userDetailsRes.json();

    // Step 3: Count badges with smart pagination (max 3 pages = 300 badges for speed)
    let badgeCount = 0;
    let cursor: string | null = '';
    let pagesFetched = 0;
    const MAX_PAGES = 3; // Limit to prevent timeouts (300 badges max to check)

    try {
      // Fetch up to MAX_PAGES to balance speed and accuracy
      while (cursor !== null && pagesFetched < MAX_PAGES) {
        const badgeUrl = cursor
          ? `https://badges.roblox.com/v1/users/${userId}/badges?limit=100&cursor=${cursor}`
          : `https://badges.roblox.com/v1/users/${userId}/badges?limit=100`;

        // Add timeout to individual badge fetch (5 seconds max)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          const badgesRes = await fetch(badgeUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!badgesRes.ok) {
            // If badge fetch fails, break and use count so far
            break;
          }

          const badgesData = await badgesRes.json();
          const pageCount = badgesData.data?.length || 0;
          badgeCount += pageCount;
          cursor = badgesData.nextPageCursor;
          pagesFetched++;

          // If we got less than 100 badges, we reached the end
          if (pageCount < 100) {
            cursor = null;
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          // Timeout or fetch error, break with what we have
          break;
        }
      }

      // If we hit the page limit and there's still a cursor, add "+" indicator
      // by just using the count we have (UI can show "300+" if needed)
    } catch (err) {
      // If badge counting fails, just use what we have so far
      console.error('Badge counting error:', err);
    }

    // Calculate actual account age in days
    const created = new Date(userDetails.created);
    const now = new Date();
    const accountAgeDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    const result = {
      username: userDetails.name,
      displayName: userDetails.displayName,
      userId: userDetails.id,
      created: userDetails.created,
      accountAgeDays: accountAgeDays,
      hasVerifiedBadge: userDetails.hasVerifiedBadge || false,
      isBanned: userDetails.isBanned || false,
      badgeCount: badgeCount,
      description: userDetails.description || ""
    };

    // Cache the result
    userCache.set(normalizedUsername, {
      data: result,
      timestamp: Date.now()
    });

    // Clean old cache entries (keep cache size manageable)
    if (userCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of userCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          userCache.delete(key);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch user data" })
    };
  }
};

export { handler };
