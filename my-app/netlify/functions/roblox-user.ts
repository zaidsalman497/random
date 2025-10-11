import { Handler } from "@netlify/functions";

const handler: Handler = async (event) => {
  // Get username from URL parameter
  const username = event.queryStringParameters?.username;

  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Username required!" })
    };
  }

  try {
    // Step 1: Search for user by username
    const searchRes = await fetch(
      `https://users.roblox.com/v1/users/search?keyword=${username}&limit=1`
    );
    const searchData = await searchRes.json();

    if (!searchData.data || searchData.data.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found!" })
      };
    }

    const userId = searchData.data[0].id;

    // Step 2: Get full user details
    const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    const userData = await userRes.json();

    // Step 3: Get user badges
    const badgesRes = await fetch(
      `https://badges.roblox.com/v1/users/${userId}/badges?limit=10&sortOrder=Desc`
    );
    const badgesData = await badgesRes.json();

    // Calculate account age in days
    const created = new Date(userData.created);
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    return {
      statusCode: 200,
      body: JSON.stringify({
        username: userData.name,
        displayName: userData.displayName,
        userId: userData.id,
        created: userData.created,
        accountAgeDays: ageInDays,
        hasVerifiedBadge: userData.hasVerifiedBadge,
        badgeCount: badgesData.data?.length || 0,
        recentBadges: badgesData.data?.slice(0, 3).map((b: any) => b.name) || []
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch user data" })
    };
  }
};

export { handler };
