"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { MessageCircle } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { userId, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (userId) {
        router.replace("/chat");
      } else {
        router.replace("/login");
      }
    }
  }, [userId, isLoading, router]);

  return (
    <div className="flex h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <MessageCircle className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
