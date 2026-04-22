const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

type RequestMethod = "POST" | "PATCH" | "DELETE" | "PUT";

async function request(path: string, options?: RequestInit) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body: unknown) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body: unknown) =>
    request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path: string, body: unknown) =>
    request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path: string) => request(path, { method: "DELETE" }),
};

export const SystemConfig = {
  list: async () => {
    const response = await api.get("/system-config");
    const item = (response as any)?.data;
    return item ? [item] : [];
  },
  create: (body: unknown) => api.put("/system-config", body),
  update: (_id: string, body: unknown) => api.put("/system-config", body),
};
