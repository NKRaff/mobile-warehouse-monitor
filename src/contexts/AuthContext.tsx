import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  userId: string | null;
  setUserId: (id: string | null) => Promise<void>;
};

const AuthContext = createContext({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const id = await AsyncStorage.getItem("userId");
    if (id) setUserIdState(id);
  }

  async function setUserId(id: string | null) {
    if (id) {
      await AsyncStorage.setItem("userId", id);
    } else {
      await AsyncStorage.removeItem("userId");
    }

    setUserIdState(id);
  }

  return (
    <AuthContext.Provider
      value={{
        userId,
        setUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}