import type { CaseInput, PostInput } from "./types";

const API = "/api";

async function request(url: string, options: Record<string, unknown> = {}) {
  const token = localStorage.getItem("blog_token");
  const res = await fetch(API + url, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...((options.headers as Record<string, string>) || {}) },
    ...options,
  } as RequestInit);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) { localStorage.removeItem("blog_token"); }
    throw Object.assign(new Error(err.error || `HTTP ${res.status}`), { data: err, status: res.status });
  }
  return res.json();
}

export const api = {
  login: async (email: string, password: string, totp?: string) => {
    const res = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, totp }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw Object.assign(new Error(data.error || "login failed"), { data, status: res.status });
    }
    if (data.token) localStorage.setItem("blog_token", data.token);
    return data;
  },
  logout: () => localStorage.removeItem("blog_token"),
  me: () => request("/auth/me"),
  getPosts: () => request("/posts"),
  getPost: (slug: string) => request(`/posts/${slug}`),
  adminPosts: () => request("/admin/posts"),
  createPost: (data: PostInput) => request("/posts", { method: "POST", body: JSON.stringify(data) }),
  updatePost: (id: number, data: PostInput) => request(`/posts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePost: (id: number) => request(`/posts/${id}`, { method: "DELETE" }),
  setup2fa: () => request("/auth/2fa/setup", { method: "POST" }),
  verify2fa: (token: string) => request("/auth/2fa/verify", { method: "POST", body: JSON.stringify({ token }) }),
  disable2fa: (password: string) => request("/auth/2fa/disable", { method: "POST", body: JSON.stringify({ password }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),
  changeEmail: (email: string, password: string) =>
    request("/auth/change-email", { method: "POST", body: JSON.stringify({ email, password }) }),
  getCases: () => request("/cases"),
  adminCases: () => request("/cases/admin/all"),
  createCase: (data: CaseInput) => request("/cases", { method: "POST", body: JSON.stringify(data) }),
  updateCase: (id: number, data: CaseInput) => request(`/cases/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCase: (id: number) => request(`/cases/${id}`, { method: "DELETE" }),
  trackView: (path: string) => request("/stats/view", { method: "POST", body: JSON.stringify({ path }) }),
  statsSummary: () => request("/stats/summary"),
  backups: () => request("/admin/backups"),
  createBackup: () => request("/admin/backups", { method: "POST" }),
  restoreBackup: (name: string) => request(`/admin/backups/${encodeURIComponent(name)}/restore`, { method: "POST" }),
  uploadImage: async (file: File) => {
    const token = localStorage.getItem("blog_token");
    const res = await fetch(API + "/media", {
      method: "POST",
      headers: { "Content-Type": file.type, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: file,
    });
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(data.error || "upload failed"), { data, status: res.status });
    return data;
  },
};
