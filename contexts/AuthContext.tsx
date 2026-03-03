
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { useToast } from './ToastContext';

interface AuthContextType {
  currentUser: User | null;
  isGuestMode: boolean;
  accessGranted: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  disclaimerAccepted: boolean;
  
  grantAccess: () => void;
  enterGuestMode: () => void;
  signIn: (user: User) => void;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  acceptDisclaimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Default access to true to show Login Screen immediately
        setAccessGranted(true);
        setIsGuestMode(false);
        setDisclaimerAccepted(false);

        // 2. Check for User Session
        const user = await storageService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            setIsGuestMode(false);
            storageService.updateUserActivity(user.id);
            
            // Check if disclaimer was previously accepted for this user
            const storedDisclaimer = localStorage.getItem(`klepplosen_disclaimer_${user.id}`);
            if (storedDisclaimer === 'accepted') {
                setDisclaimerAccepted(true);
            }
        }

      } catch (e) {
        console.error("Auth init failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const grantAccess = () => {
    setAccessGranted(true);
    sessionStorage.setItem('klepplosen_access', 'granted');
    addToast("Tilgang godkjent", 'success');
  };

  const enterGuestMode = () => {
    setIsGuestMode(true);
    setAccessGranted(true);
    // Guest must always accept disclaimer
    setDisclaimerAccepted(false);
    addToast("Du seiler nå som gjest", 'info');
  };

  const signIn = (user: User) => {
    setCurrentUser(user);
    setAccessGranted(true);
    setIsGuestMode(false);
    
    // Check if disclaimer was previously accepted for this user
    const storedDisclaimer = localStorage.getItem(`klepplosen_disclaimer_${user.id}`);
    if (storedDisclaimer === 'accepted') {
        setDisclaimerAccepted(true);
    } else {
        setDisclaimerAccepted(false);
    }
    
    addToast(`Velkommen ombord, ${user.name}!`, 'success');
  };

  const signOut = async () => {
    setIsLoading(true);
    await storageService.signOut();
    setCurrentUser(null);
    setIsGuestMode(false);
    setDisclaimerAccepted(false);
    addToast("Du er logget ut", 'info');
    setIsLoading(false);
  };

  const updateUser = (updates: Partial<User>) => {
      if (currentUser) {
          setCurrentUser({ ...currentUser, ...updates });
      }
  };

  const acceptDisclaimer = () => {
      setDisclaimerAccepted(true);
      if (currentUser) {
          localStorage.setItem(`klepplosen_disclaimer_${currentUser.id}`, 'accepted');
      }
      // Do not save for guest, so it shows every time
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      currentUser,
      isGuestMode,
      accessGranted,
      isLoading,
      isAdmin,
      disclaimerAccepted,
      grantAccess,
      enterGuestMode,
      signIn,
      signOut,
      updateUser,
      acceptDisclaimer
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
