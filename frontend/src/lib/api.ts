const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export async function apiRequest(
  method: HttpMethod,
  endpoint: string,
  body?: unknown
) {
  const token = localStorage.getItem("sierra_token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error");
  }
}
