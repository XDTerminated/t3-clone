"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface CustomizationContextType {
  userName: string;
  userRole: string;
  userInterests: string;
  setUserName: (name: string) => void;
  setUserRole: (role: string) => void;
  setUserInterests: (interests: string) => void;
  isLoaded: boolean;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

const USER_NAME_STORAGE_KEY = "user_name";
const USER_ROLE_STORAGE_KEY = "user_role";
const USER_INTERESTS_STORAGE_KEY = "user_interests";

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState<string>("");
  const [userRole, setUserRoleState] = useState<string>("");
  const [userInterests, setUserInterestsState] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load customization data from localStorage on mount
  useEffect(() => {
    const storedName = localStorage.getItem(USER_NAME_STORAGE_KEY) ?? "";
    const storedRole = localStorage.getItem(USER_ROLE_STORAGE_KEY) ?? "";
    const storedInterests = localStorage.getItem(USER_INTERESTS_STORAGE_KEY) ?? "";

    setUserNameState(storedName);
    setUserRoleState(storedRole);
    setUserInterestsState(storedInterests);
    setIsLoaded(true);
  }, []);

  const setUserName = (name: string) => {
    setUserNameState(name);
    localStorage.setItem(USER_NAME_STORAGE_KEY, name);
  };

  const setUserRole = (role: string) => {
    setUserRoleState(role);
    localStorage.setItem(USER_ROLE_STORAGE_KEY, role);
  };

  const setUserInterests = (interests: string) => {
    setUserInterestsState(interests);
    localStorage.setItem(USER_INTERESTS_STORAGE_KEY, interests);
  };

  return (
    <CustomizationContext.Provider
      value={{
        userName,
        userRole,
        userInterests,
        setUserName,
        setUserRole,
        setUserInterests,
        isLoaded,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (context === undefined) {
    throw new Error("useCustomization must be used within a CustomizationProvider");
  }
  return context;
}