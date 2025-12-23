"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeProvider } from "@/lib/theme-provider";
import { AppConfigLoader } from "@/components/app-config-loader";
import { DynamicFavicon } from "@/components/dynamic-favicon";
import { DynamicTitle } from "@/components/dynamic-title";
import { ChatWrapper } from "@/components/chat/chat-wrapper";
import type { User } from "@supabase/supabase-js";

import { PresenceManager } from "@/components/presence-manager";
import { NotificationManager } from "@/components/notification-manager";

type UserContextType = {
  user: User | null;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);

    // Cargar usuario de forma asíncrona sin bloquear
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppConfigLoader />
      <DynamicFavicon />
      <DynamicTitle />
      <NotificationManager />

      <UserContext.Provider value={{ user, loading }}>
        <PresenceManager />
        {children}
        <ChatWrapper />
      </UserContext.Provider>
    </ThemeProvider>
  );
}

export const useUser = () => useContext(UserContext);






