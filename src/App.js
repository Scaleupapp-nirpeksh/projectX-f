import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import OrgHomePage from "./pages/OrgHomePage"; // Organization homepage
import AdminControlPage from "./pages/AdminControlPage"; // Admin Control Page
import FinancePage from "./pages/FinanceManagement";
import TasksPage from "./pages/TaskManagement";
import DocumentationPage from "./pages/Documentation";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/organization/:orgId" element={<OrgHomePage />} /> {/* Org homepage */}
        <Route path="/organization/:orgId/admin" element={<AdminControlPage />} /> {/* Admin controls */}
        <Route path="/organization/:orgId/finance" element={<FinancePage />} />
        <Route path="/organization/:orgId/tasks" element={<TasksPage />} />
        <Route path="/organization/:orgId/documentation" element={<DocumentationPage />} />
            
      </Routes>
    </Router>
  );
}

export default App;
