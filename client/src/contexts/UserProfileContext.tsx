import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider = ({ children }: UserProfileProviderProps) => {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile');
      const data = await response.json();
      setProfile({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || ""
      });
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...newProfile }));
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, refreshProfile, isLoading }}>
      {children}
    </UserProfileContext.Provider>
  );
};