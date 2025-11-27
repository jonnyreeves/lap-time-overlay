import type { PublicUser } from "../auth/service.js";

export interface GraphQLContext {
  currentUser: PublicUser | null;
  sessionToken: string | null;
  setSessionCookie: (token: string, expiresAt: number) => void;
  clearSessionCookie: () => void;
}
