import { createContext, useContext, useState } from "react";

const AuthContext = createContext<{ isLoggedIn: boolean }>({ isLoggedIn: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn] = useState(true); // change this to false initially if testing redirect
  return <AuthContext.Provider value={{ isLoggedIn }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
