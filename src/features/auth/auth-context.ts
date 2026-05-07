import { createContext } from "react";

import { UseAuthSessionResult } from "./use-auth-session";

export const AuthContext = createContext<UseAuthSessionResult | null>(null);
