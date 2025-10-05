import React, { useState } from "react";
import Button from "@mui/material/Button";

function App() {
	const [msg, setMsg] = useState("");


	const fetchMessage = async () => {
		try {
			const res = await fetch('/.netlify/functions/hello');
			if (!res.ok) {
				setMsg('Error fetching message from function.');
				return;
			}
			const data = await res.json();
			setMsg(data.message || 'No message from function.');
		} catch (err) {
			console.error('Function fetch failed', err);
			setMsg('Error fetching message from function');
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
