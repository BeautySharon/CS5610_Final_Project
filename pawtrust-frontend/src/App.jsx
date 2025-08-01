import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import SitterDashboard from "./pages/SitterDashboard";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/sitter" element={<SitterDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
