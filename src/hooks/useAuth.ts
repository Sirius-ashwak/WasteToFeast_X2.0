import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Local auth – stores users + session in localStorage.
// No Supabase required. Drop-in replacement for the Supabase-backed version.
// ---------------------------------------------------------------------------

interface LocalUser {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: 'user' | 'restaurant_admin';
  phone: string | null;
  password: string;
  created_at: string;
}

const USERS_KEY = 'wtf_local_users';
const SESSION_KEY = 'wtf_local_session';

const getUsers = (): LocalUser[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveUsers = (users: LocalUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const getStoredSession = (): LocalUser | null => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
};

const saveSession = (user: LocalUser | null) => {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = getStoredSession();
    setUser(stored);
    setLoading(false);
    setInitialized(true);
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userData: {
      username: string;
      full_name?: string;
      role?: 'user' | 'restaurant_admin';
      phone?: string;
    }
  ) => {
    const users = getUsers();

    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error(
        'An account with this email already exists. Please sign in instead or use a different email address.'
      );
    }

    if (users.find((u) => u.username.toLowerCase() === userData.username.toLowerCase())) {
      throw new Error('Username is already taken. Please choose a different one.');
    }

    const newUser: LocalUser = {
      id: crypto.randomUUID(),
      email,
      password,
      username: userData.username,
      full_name: userData.full_name || null,
      role: userData.role || 'user',
      phone: userData.phone || null,
      created_at: new Date().toISOString(),
    };

    saveUsers([...users, newUser]);
    saveSession(newUser);
    setUser(newUser);

    return { user: newUser };
  };

  const signIn = async (email: string, password: string) => {
    const users = getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!found) {
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    }

    saveSession(found);
    setUser(found);

    return { user: found };
  };

  const signOut = async () => {
    saveSession(null);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<LocalUser>) => {
    if (!user) throw new Error('No user logged in');
    const users = getUsers();
    const updated = { ...user, ...updates };
    saveUsers(users.map((u) => (u.id === user.id ? updated : u)));
    saveSession(updated);
    setUser(updated);
    return updated;
  };

  return {
    user,
    profile: user
      ? {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          phone: user.phone,
          created_at: user.created_at,
        }
      : null,
    session: user ? { user } : null,
    loading,
    profileLoading: false,
    initialized,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    isRestaurantAdmin: user?.role === 'restaurant_admin',
  };
}
