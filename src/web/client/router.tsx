import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "./routes/auth/login.js";
import { RegisterPage } from "./routes/auth/register.js";
import { AuthLayout } from "./routes/AuthLayout.js";
import { HomePage } from "./routes/index.js";
import { NotFoundPage } from "./routes/not-found/index.js";
import { RequireAuth } from "./routes/RequireAuth.js";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/auth/login", element: <LoginPage /> },
      { path: "/auth/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
