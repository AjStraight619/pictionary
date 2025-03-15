import { Routes, Route } from "react-router";
import Layout from "@/layout";
import Home from "./pages/home";
import Game from "./pages/game";

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/game/:id" element={<Game />} />
      </Route>
    </Routes>
  );
};

export default App;
