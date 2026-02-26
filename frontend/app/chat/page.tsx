"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useWebSocket } from "@/context/websocket-context";
import type { User, Message } from "@/lib/types";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { MessagePanel } from "@/components/chat/message-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut, MessageCircle, Menu, X, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const router = useRouter();
  const { userId, username, logout, isLoading } = useAuth();
  const { isConnected, lastMessage } = useWebSocket();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Auth Guard
  useEffect(() => {
    if (!isLoading && !userId) {
      router.replace("/login");
    }
  }, [userId, isLoading, router]);

  // Restore selected user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("selectedUserId");
    const storedName = localStorage.getItem("selectedUserName");
    if (stored && storedName) {
      setSelectedUser({ userId: stored, username: storedName });
    }
  }, []);

  /**
   * YOUR INTEGRATED CODE BLOCK
   * Listens for new messages from the WebSocket and updates the local state
   */
  useEffect(() => {
    if (!lastMessage) return;

    const selectedUserId = selectedUser?.userId;

    // Only append if message belongs to current chat (either sent by me or to me)
    if (
      selectedUserId && 
      (lastMessage.senderId === selectedUserId || lastMessage.senderId === userId)
    ) {
      setMessages((prev) => [...prev, lastMessage]);
    }
  }, [lastMessage, selectedUser, userId]);

  function handleSelectUser(user: User) {
    setSelectedUser(user);
    localStorage.setItem("selectedUserId", user.userId);
    localStorage.setItem("selectedUserName", user.username);
    setSidebarOpen(false);
    // Note: You might want to clear or fetch new history here
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (isLoading || !userId) {
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

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageCircle className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-card-foreground">ChatNow</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
            )}
            <span className="hidden sm:inline">{isConnected ? "Connected" : "Reconnecting..."}</span>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">{username}</span>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        <aside className="hidden w-72 shrink-0 md:block lg:w-80">
          <ChatSidebar
            selectedUserId={selectedUser?.userId ?? null}
            onSelectUser={handleSelectUser}
          />
        </aside>

        <div className={cn("absolute inset-0 z-40 md:hidden", sidebarOpen ? "block" : "hidden")}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 h-full w-72 shadow-xl">
            <ChatSidebar selectedUserId={selectedUser?.userId ?? null} onSelectUser={handleSelectUser} />
          </aside>
        </div>

        <main className="flex-1">
          <MessagePanel 
            selectedUser={selectedUser} 
            messages={messages} 
            setMessages={setMessages} 
          />
        </main>
      </div>
    </div>
  );
}