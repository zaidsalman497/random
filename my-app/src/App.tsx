import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Home from "./pages/Home";
import Meme from "./pages/Meme";
import Fact from "./pages/Fact";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/meme" element={<Meme />} />
        <Route path="/fact" element={<Fact />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
