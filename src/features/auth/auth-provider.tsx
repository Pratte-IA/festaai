import { PropsWithChildren } from "react";

import { AuthContext } from "./auth-context";
import { useAuthSession } from "./use-auth-session";

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const authSession = useAuthSession();

  return <AuthContext.Provider value={authSession}>{children}</AuthContext.Provider>;
};
