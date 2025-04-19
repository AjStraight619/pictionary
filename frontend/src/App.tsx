import { Routes, Route } from "react-router";
import Layout from "@/layout";
import Home from "./pages/home";
import Game from "./pages/game";
import SignUp from "./components/auth/sign-up";
import SignIn from "./components/auth/sign-out";

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
      </Route>
    </Routes>
  );
};

export default App;
