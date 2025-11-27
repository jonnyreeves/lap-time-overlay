import { createBrowserRouter } from "react-router-dom";
import { AuthPage } from "./routes/auth/AuthForm.js";
import { AuthLayout } from "./routes/AuthLayout.js";
import { HomePage } from "./routes/index.js";
import { NotFoundPage } from "./routes/not-found/index.js";
import { RequireAuth } from "./routes/RequireAuth.js";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <AuthPage mode="login" /> },
      { path: "/register", element: <AuthPage mode="register" /> },
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
