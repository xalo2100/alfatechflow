"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/providers";
import { ChatWidget } from "./chat-widget";
import { createClient } from "@/lib/supabase/client";

export function ChatWrapper() {
    const { user, loading } = useUser();
    const [profileName, setProfileName] = useState("");
    const supabase = createClient();

    useEffect(() => {
        async function getProfile() {
            if (user) {
                const { data } = await supabase
                    .from("perfiles")
                    .select("nombre_completo")
                    .eq("id", user.id)
                    .single();

                if (data?.nombre_completo) {
                    setProfileName(data.nombre_completo);
                } else {
                    setProfileName(user.email || "Usuario");
                }
            }
        }
        getProfile();
    }, [user, supabase]);

    if (loading || !user) return null;

    return <ChatWidget currentUserId={user.id} currentUserName={profileName} />;
}
