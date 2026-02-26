"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./auth-context";
import type { IncomingWSMessage } from "@/lib/types";

const WS_URL =
  "wss://y8suig0qe7.execute-api.ap-south-1.amazonaws.com/dev";

interface WebSocketContextType {
  sendMessage: (receiverId: string, message: string) => void;
  lastMessage: IncomingWSMessage | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export function WebSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] =
    useState<IncomingWSMessage | null>(null);

  const connect = useCallback(() => {
    if (!userId) return;

    const token = localStorage.getItem("token");
    if (!token) return; // silently wait until token exists

    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

   ws.onmessage = (event) => {
  console.log("WS RECEIVED:", event.data);
 
  try {
    const data = JSON.parse(event.data);
    setLastMessage(data);
  } catch (e) {
    console.log("Invalid JSON", e);
  }
};

    ws.onclose = () => {
      console.log("WebSocket closed");
      setIsConnected(false);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [userId]);

  useEffect(() => {
    // Wait 100ms to ensure localStorage updated after login
    const timeout = setTimeout(() => {
      connect();
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback(
    (receiverId: string, message: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            action: "sendMessage",
            receiverId,
            message,
          })
        );
      }
    },
    []
  );

  return (
    <WebSocketContext.Provider
      value={{ sendMessage, lastMessage, isConnected }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}