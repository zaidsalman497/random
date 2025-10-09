import { useState } from "react";
import { Button, CircularProgress } from "@mui/material";

function Meme() {
  const [meme, setMeme] = useState("");
  const [loading, setLoading] = useState(false);

  const getMeme = async () => {
    setLoading(true);
    const res = await fetch("/.netlify/functions/meme");
    const data = await res.json();
    setMeme(data.meme);
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Gaming Meme Generator 🎮</h1>
      <Button variant="contained" onClick={getMeme}>Generate Meme</Button>
      {loading && <CircularProgress />}
      <p style={{ fontSize: "20px", marginTop: "20px" }}>{meme}</p>
    </div>
  );
}

export default Meme;
