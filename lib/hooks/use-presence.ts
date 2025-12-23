"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePresence(userId: string | undefined) {
    const supabase = createClient();

    useEffect(() => {
        if (!userId) return;

        // 1. Initial heartbeat
        const updatePresence = async () => {
            await supabase.rpc("update_user_presence", { p_user_id: userId });
        };

        updatePresence();

        // 2. Set interval for heartbeat every 2 minutes
        const interval = setInterval(updatePresence, 2 * 60 * 1000);

        // 3. Update on focus
        const handleFocus = () => {
            updatePresence();
        };

        window.addEventListener("focus", handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
        };
    }, [userId, supabase]);
}
