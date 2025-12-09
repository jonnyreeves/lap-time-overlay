import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "./routes/auth/login.js";
import { RegisterPage } from "./routes/auth/register.js";
import { AuthLayout } from "./routes/AuthLayout.js";
import { HomePage } from "./routes/HomePage.js";
import { NotFoundPage } from "./routes/not-found/index.js";
import { RequireAuth } from "./routes/RequireAuth.js";
import CreateSessionRoute from "./routes/session/create.js";
import ViewSessionRoute from "./routes/session/view.js";
import CircuitViewPage from "./routes/circuit/CircuitViewPage.js";

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
      { path: "/session/create", element: <CreateSessionRoute /> },
      { path: "/session/:sessionId", element: <ViewSessionRoute /> },
      { path: "/circuits/view/:circuitId", element: <CircuitViewPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
