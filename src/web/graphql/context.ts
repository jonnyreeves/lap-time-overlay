import type { PublicUser } from "../auth/service.js";
import type { Repositories } from "./repositories.js";

export interface GraphQLContext {
  currentUser: PublicUser | null;
  sessionToken: string | null;
  setSessionCookie: (token: string, expiresAt: number) => void;
  clearSessionCookie: () => void;
  repositories: Repositories;
}
