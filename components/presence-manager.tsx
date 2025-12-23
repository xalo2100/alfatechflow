"use client";

import { usePresence } from "@/lib/hooks/use-presence";
import { useUser } from "@/components/providers";

export function PresenceManager() {
    const { user } = useUser();
    usePresence(user?.id);
    return null;
}
