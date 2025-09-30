import React, { useState } from "react";
import Button from "@mui/material/Button";

function App() {
	const [msg, setMsg] = useState("");


	const fetchMessage = async () => {
		try {
			const res = await fetch('/hello.json');
			if (!res.ok) {
				setMsg('Error fetching local fallback.');
				return;
			}
			const data = await res.json();
			setMsg(data.message || 'No message in fallback.');
		} catch (err) {
			console.error('Local fallback fetch failed', err);
			setMsg('Error fetching local fallback');
		}
	};

	return (
		<div style={{ textAlign: "center", marginTop: "50px" }}>
			<h1>React + Netlify Function</h1>
			<Button variant="contained" onClick={fetchMessage}>
				Get Message
			</Button>
			<p>{msg}</p>
		</div>
	);
}

export default App;
