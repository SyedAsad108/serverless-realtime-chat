import type { AuthResponse, Message, User } from "./types";

const BASE_URL =
  "https://74lfttdg01.execute-api.ap-south-1.amazonaws.com/dev";

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Registration failed" }));
    throw new Error(err.message || "Registration failed");
  }
  return res.json();
}

export async function loginUser(data: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Login failed" }));
    throw new Error(err.message || "Login failed");
  }
  return res.json();
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${BASE_URL}/users`);
  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }
  return res.json();
}

export async function getMessages(
  user1: string,
  user2: string
): Promise<Message[]> {
  const res = await fetch(
    `${BASE_URL}/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch messages");
  }
  return res.json();
}
