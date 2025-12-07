import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Home from "./pages/Home";
import Meme from "./pages/Meme";
import Fact from "./pages/Fact";
import Roast from "./pages/Roast";
import Battle from "./pages/Battle";
import GameBuilder from "./pages/GameBuilder";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/meme" element={<Meme />} />
        <Route path="/fact" element={<Fact />} />
        <Route path="/roast" element={<Roast />} />
        <Route path="/battle" element={<Battle />} />
        <Route path="/game-builder" element={<GameBuilder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
