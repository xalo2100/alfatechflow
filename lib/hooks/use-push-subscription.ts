"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushSubscription(userId: string | undefined) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!userId || typeof window === 'undefined' || !('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) {
            return;
        }

        const checkSubscription = async () => {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();

            setSubscription(sub);
            setIsSubscribed(!!sub);

            if (sub && userId) {
                // Sync with DB if needed (optional optimization)
                await saveSubscriptionToDb(userId, sub);
            }
        };

        checkSubscription();
    }, [userId]);

    const saveSubscriptionToDb = async (uid: string, sub: PushSubscription) => {
        try {
            await supabase.from("push_subscriptions").upsert({
                user_id: uid,
                subscription_json: sub.toJSON(),
                device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
            }, { onConflict: 'user_id, subscription_json' });
        } catch (err) {
            console.error("Error saving push subscription to DB:", err);
        }
    };

    const subscribe = async () => {
        if (!VAPID_PUBLIC_KEY) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            setSubscription(sub);
            setIsSubscribed(true);

            if (userId) {
                await saveSubscriptionToDb(userId, sub);
            }

            return sub;
        } catch (err) {
            console.error("Failed to subscribe to push notifications:", err);
        }
    };

    const unsubscribe = async () => {
        if (subscription) {
            await subscription.unsubscribe();

            if (userId) {
                await supabase.from("push_subscriptions")
                    .delete()
                    .match({ user_id: userId, subscription_json: subscription.toJSON() });
            }

            setSubscription(null);
            setIsSubscribed(false);
        }
    };

    return { isSubscribed, subscribe, unsubscribe };
}
