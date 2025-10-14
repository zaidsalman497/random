import { useState } from "react";
import { Button, CircularProgress, TextField } from "@mui/material";

function ImageGen() {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/generate-image", {
        method: "POST",
        body: JSON.stringify({ prompt }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setImageUrl(data.imageUrl);
    } catch (error) {
      console.error("Error generating image:", error);
    }
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px", padding: "20px" }}>
      <h1>AI Image Generator 🎨</h1>
      <TextField
        label="Enter a prompt"
        variant="outlined"
        fullWidth
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{ maxWidth: "600px", marginBottom: "20px" }}
        placeholder="e.g., A futuristic gaming setup with neon lights"
      />
      <br />
      <Button variant="contained" onClick={generateImage} disabled={!prompt.trim() || loading}>
        Generate Image
      </Button>
      {loading && <CircularProgress style={{ marginTop: "20px" }} />}
      {imageUrl && !loading && (
        <div style={{ marginTop: "30px" }}>
          <img src={imageUrl} alt="Generated" style={{ maxWidth: "100%", borderRadius: "8px" }} />
        </div>
      )}
    </div>
  );
}

export default ImageGen;
