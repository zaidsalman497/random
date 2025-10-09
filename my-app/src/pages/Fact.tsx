import { useState } from "react";
import { Button, CircularProgress } from "@mui/material";

function Fact() {
  const [fact, setFact] = useState("");
  const [loading, setLoading] = useState(false);

  const getFact = async () => {
    setLoading(true);
    const res = await fetch("/.netlify/functions/fact");
    const data = await res.json();
    setFact(data.fact);
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Random Fact Generator 🎲</h1>
      <Button variant="contained" onClick={getFact}>Get Random Fact</Button>
      {loading && <CircularProgress />}
      <p style={{ fontSize: "20px", marginTop: "20px" }}>{fact}</p>
    </div>
  );
}

export default Fact;
