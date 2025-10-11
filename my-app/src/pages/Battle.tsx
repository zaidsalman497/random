import { useState } from "react";
import { Button, TextField, CircularProgress, Card, CardContent } from "@mui/material";

interface BattleResult {
  winner: string;
  battleSummary: string;
  player1Score: number;
  player2Score: number;
  finishingMove: string;
}

function Battle() {
  const [username1, setUsername1] = useState("");
  const [username2, setUsername2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState("");

  const handleBattle = async () => {
    if (!username1 || !username2) {
      setError("Enter both usernames!");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Fetch both players' data
      const [user1Res, user2Res] = await Promise.all([
        fetch(`/.netlify/functions/roblox-user?username=${username1}`),
        fetch(`/.netlify/functions/roblox-user?username=${username2}`)
      ]);

      const player1 = await user1Res.json();
      const player2 = await user2Res.json();

      if (!user1Res.ok || !user2Res.ok) {
        setError("One or both users not found!");
        setLoading(false);
        return;
      }

      // Run the battle!
      const battleRes = await fetch("/.netlify/functions/battle-compare", {
        method: "POST",
        body: JSON.stringify({ player1, player2 })
      });

      const battleData = await battleRes.json();
      setResult(battleData);

    } catch (err) {
      setError("Battle crashed! Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>⚔️ Roblox Battle Mode ⚔️</h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <TextField
          fullWidth
          label="Player 1 Username"
          value={username1}
          onChange={(e) => setUsername1(e.target.value)}
        />
        <TextField
          fullWidth
          label="Player 2 Username"
          value={username2}
          onChange={(e) => setUsername2(e.target.value)}
        />
        <Button
          variant="contained"
          color="error"
          onClick={handleBattle}
          disabled={loading}
        >
          BATTLE!
        </Button>
      </div>

      {error && (
        <p style={{ color: "red", textAlign: "center" }}>{error}</p>
      )}

      {loading && (
        <div style={{ textAlign: "center" }}>
          <CircularProgress />
          <p>Battle in progress...</p>
        </div>
      )}

      {result && (
        <Card style={{ marginTop: "20px", background: "#f5f5f5" }}>
          <CardContent>
            <h2 style={{ textAlign: "center", color: "#d32f2f" }}>
              🏆 WINNER: {result.winner} 🏆
            </h2>

            <div style={{ display: "flex", justifyContent: "space-around", margin: "20px 0" }}>
              <div style={{ textAlign: "center" }}>
                <h3>{username1}</h3>
                <p style={{ fontSize: "32px", fontWeight: "bold", color: "#1976d2" }}>
                  {result.player1Score}/10
                </p>
              </div>
              <div style={{ fontSize: "40px", alignSelf: "center" }}>VS</div>
              <div style={{ textAlign: "center" }}>
                <h3>{username2}</h3>
                <p style={{ fontSize: "32px", fontWeight: "bold", color: "#1976d2" }}>
                  {result.player2Score}/10
                </p>
              </div>
            </div>

            <p style={{ fontSize: "18px", margin: "20px 0", textAlign: "center" }}>
              {result.battleSummary}
            </p>

            <p style={{
              fontSize: "20px",
              fontWeight: "bold",
              textAlign: "center",
              color: "#d32f2f",
              marginTop: "20px"
            }}>
              💥 {result.finishingMove}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Battle;
