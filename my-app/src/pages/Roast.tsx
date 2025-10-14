import { useState } from "react";
import { Button, TextField, CircularProgress, Card, CardContent } from "@mui/material";

interface RoastData {
  title: string;
  mainRoast: string;
  rating: string;
  funFact: string;
}

function Roast() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");

  const handleRoast = async () => {
    if (!username) {
      setError("Enter a username!");
      return;
    }

    setLoading(true);
    setError("");
    setRoastData(null);
    setImageUrl("");

    try {
      // Step 1: Get Roblox user data
      const userRes = await fetch(
        `/.netlify/functions/roblox-user?username=${username}`
      );
      const userData = await userRes.json();

      if (!userRes.ok) {
        setError(userData.error || "User not found!");
        setLoading(false);
        return;
      }

      // Step 2: Generate roast
      const roastRes = await fetch("/.netlify/functions/generate-roast", {
        method: "POST",
        body: JSON.stringify(userData)
      });

      if (!roastRes.ok) {
        const roastError = await roastRes.json();
        setError(`Roast generation failed: ${roastError.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      const roast = await roastRes.json();

      // Step 3: Generate image
      const imageRes = await fetch("/.netlify/functions/generate-image", {
        method: "POST",
        body: JSON.stringify({
          username: userData.username,
          rating: roast.rating,
          accountAgeDays: userData.accountAgeDays
        })
      });

      if (!imageRes.ok) {
        const imageError = await imageRes.json();
        console.warn('Image generation failed:', imageError);
        // Continue without image - it's optional
      }

      const imageData = imageRes.ok ? await imageRes.json() : { imageUrl: '' };

      setRoastData(roast);
      setImageUrl(imageData.imageUrl || '');

    } catch (err) {
      console.error('Error:', err);
      setError(`Something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>🎮 Roblox Roast Generator 🔥</h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <TextField
          fullWidth
          label="Roblox Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleRoast()}
        />
        <Button
          variant="contained"
          onClick={handleRoast}
          disabled={loading}
        >
          Roast!
        </Button>
      </div>

      {error && (
        <p style={{ color: "red", textAlign: "center" }}>{error}</p>
      )}

      {loading && (
        <div style={{ textAlign: "center" }}>
          <CircularProgress />
          <p>Generating epic roast...</p>
        </div>
      )}

      {roastData && (
        <Card style={{ marginTop: "20px" }}>
          <CardContent>
            <h2 style={{ color: "#1976d2" }}>{roastData.title}</h2>
            <p style={{ fontSize: "18px", margin: "15px 0" }}>
              {roastData.mainRoast}
            </p>
            <p><strong>Rating:</strong> {roastData.rating}</p>
            <p><strong>Fun Fact:</strong> {roastData.funFact}</p>
          </CardContent>
        </Card>
      )}

      {imageUrl && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <img
            src={imageUrl}
            alt="Roast meme"
            style={{ maxWidth: "100%", borderRadius: "8px" }}
          />
        </div>
      )}
    </div>
  );
}

export default Roast;
