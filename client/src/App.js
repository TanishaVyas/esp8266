import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Storage from "./pages/Storage";
import Realtime from "./pages/Realtime";
import TestConnection from "./pages/TestConnection";
import UploadImage from "./pages/UploadImage";
import SignUp from "./components/SignUp";

// Protected Route Component
const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem("token"); // Check if token exists
  return token ? element : <Navigate to="/auth/login" replace />;
};

function App() {
  return (
    <Router>
      <Navbar />
      <TestConnection />
      <Routes>
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/storage/images"
          element={<ProtectedRoute element={<Storage />} />}
        />
        <Route
          path="/storage/realtime"
          element={<ProtectedRoute element={<Realtime />} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
