import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./Header";
import Hero from "./Hero";
import Login from "./Login";

function App() {
  // Always name React components with uppercase
  return (
    <BrowserRouter>
      <Header /> {/* stays outside so it’s visible on every page */}{" "}
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<Login />} />{" "}
      </Routes>{" "}
    </BrowserRouter>
  );
}

export default App;
