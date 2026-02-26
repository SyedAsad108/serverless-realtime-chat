"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useWebSocket } from "@/context/websocket-context";
import { getMessages } from "@/lib/api";
import type { Message, User } from "@/lib/types";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

interface MessagePanelProps {
  selectedUser: User | null;
}

export function MessagePanel({ selectedUser }: MessagePanelProps) {
  const { userId } = useAuth();
  const { sendMessage, lastMessage } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load message history when selected user changes
  useEffect(() => {
    if (!selectedUser || !userId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function fetchMessages() {
      setIsLoading(true);
      try {
        const data = await getMessages(userId!, selectedUser!.userId);
        if (!cancelled) {
          const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
          setMessages(sorted);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load messages");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedUser, userId]);

  // Auto-scroll on message changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage || !selectedUser) return;

    if (lastMessage.senderId === selectedUser.userId) {
      const newMsg: Message = {
        senderId: lastMessage.senderId,
        receiverId: userId!,
        message: lastMessage.message,
        timestamp: lastMessage.timestamp,
      };
      setMessages((prev) => [...prev, newMsg]);
    }
  }, [lastMessage, selectedUser, userId]);

  function handleSend(text: string) {
    if (!selectedUser || !userId) return;

    // Optimistically append message
    const optimisticMsg: Message = {
      senderId: userId,
      receiverId: selectedUser.userId,
      message: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Send via WebSocket
    sendMessage(selectedUser.userId, text);
  }

  if (!selectedUser) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No conversation selected</h3>
          <p className="max-w-xs text-center text-sm">
            Choose a contact from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {selectedUser.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-card-foreground">{selectedUser.username}</p>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="flex flex-col gap-3 py-4">
          {isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                >
                  <Skeleton className="h-12 w-48 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MessageSquare className="mb-2 h-8 w-8" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Say hello to start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <MessageBubble
                key={msg.messageId || `${msg.timestamp}-${idx}`}
                message={msg}
                isOwn={msg.senderId === userId}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
