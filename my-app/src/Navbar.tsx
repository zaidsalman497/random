import { Link } from "react-router-dom";
import { AppBar, Toolbar, Button } from "@mui/material";

function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Button color="inherit" component={Link} to="/">Home</Button>
        <Button color="inherit" component={Link} to="/meme">Meme Generator</Button>
        <Button color="inherit" component={Link} to="/fact">Random Fact</Button>
        <Button color="inherit" component={Link} to="/roast">Roast Battle</Button>
        <Button color="inherit" component={Link} to="/battle">Battle</Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
