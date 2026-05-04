import { createBrowserRouter } from "react-router-dom";
import { Homepage } from "./pages/Homepage";
import { RescueSearchScreen } from "./pages/RescueSearchScreen";
import { SearchResultsPage } from "./pages/SearchResultsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MyRequestsPage } from "./pages/MyRequestsPage";
import { TechnicianDashboard } from "./pages/TechnicianDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Homepage />,
  },
  {
    path: "/search",
    element: <RescueSearchScreen />,
  },
  {
    path: "/results",
    element: <SearchResultsPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/my-requests",
    element: <MyRequestsPage />,
  },
  {
    path: "/technician-dashboard",
    element: <TechnicianDashboard />,
  },
  {
    path: "/admin-dashboard",
    element: <AdminDashboard />,
  },
]);