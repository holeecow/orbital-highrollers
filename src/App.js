import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import AuthDetails from "./components/auth/AuthDetails";

function App() {
  // Always name React components with uppercase
  return (
    <BrowserRouter>
      <Header /> {/* stays outside so it’s visible on every page */}{" "}
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<Login />} />{" "}
        <Route path="/signup" element={<Signup />} />{" "}
        <Route path="/authdetails" element={<AuthDetails />} />{" "}
      </Routes>{" "}
    </BrowserRouter>
  );
}

export default App;
