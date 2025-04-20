import { Routes, Route } from "react-router";
import Layout from "@/layout";
import Home from "./pages/home";
import Game from "./pages/game";
import SignUp from "./components/auth/sign-up";
import SignIn from "./components/auth/sign-in";
import { ProtectedRoute } from "./components/auth/protected-route";

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Protected routes - require authentication */}
        <Route element={<ProtectedRoute authRequired />}>
          <Route path="/" element={<Home />} />
          <Route path="/game/:id" element={<Game />} />
        </Route>

        {/* Guest-only routes - redirect to home if already logged in */}
        <Route element={<ProtectedRoute guestOnly />}>
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/sign-in" element={<SignIn />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
