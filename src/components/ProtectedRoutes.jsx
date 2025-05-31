import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children, allowedRole }) => {
  const isLoggedIn = sessionStorage.getItem("isUserLoggedIn");
  const role = sessionStorage.getItem("role");

  if (!isLoggedIn || role !== allowedRole) {
    return <Navigate to="/" />; 
  }

  return children;
};
