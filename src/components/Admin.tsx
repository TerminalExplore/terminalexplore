import { useEffect, useState } from "react";
import { api } from "../api";
import { renderMarkdown } from "../markdown";
import type { BackupInfo, CaseInput, CaseStudy, Post, PostInput } from "../types";

interface UserInfo {
  id: number;
  email: string;
  totpEnabled: boolean;
}

type Tab = "posts" | "editor" | "cases" | "settings" | "stats" | "backups";

const emptyPost: PostInput = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  tag: "",
  cover_url: "",
  seo_title: "",
  seo_description: "",
  published: 1,
};

const emptyCase: CaseInput = {
  slug: "",
  title: "",
  summary: "",
  problem: "",
  solution: "",
  result: "",
  stack: "",
  metric: "",
  published: 1,
};

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("blog_token"));
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (token) {
      api.me().then((d) => setUser(d.user)).catch(() => {
        setToken(null);
        localStorage.removeItem("blog_token");
      });
    }
  }, [token]);

  if (!token || !user) return <Login onLogin={(t, u) => { setToken(t); setUser(u); }} />;

  return <Dashboard user={user} onLogout={() => { setToken(null); setUser(null); api.logout(); }} onUpdate={setUser} />;
}

function Login({ onLogin }: { onLogin: (token: string, user: UserInfo) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [requireTotp, setRequireTotp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password, totp || undefined);
      onLogin(data.token, data.user);
    } catch (err: unknown) {
      const e = err as { data?: { requireTotp?: boolean }; message: string };
      if (e.data?.requireTotp) setRequireTotp(true);
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-login">
          <h2>admin</h2>
          <p className="subtitle">sign in to manage the blog</p>
          <div className="admin-card">
            <form onSubmit={submit}>
              {!requireTotp && (
                <>
                  <Field label="email">
                    <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </Field>
                  <Field label="password">
                    <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </Field>
                </>
              )}
              {requireTotp && (
                <Field label="2fa code">
                  <input className="input" inputMode="numeric" autoComplete="one-time-code" value={totp} onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))} required placeholder="000000" />
                </Field>
              )}
              {error && <div className="admin-msg admin-msg-error">{error}</div>}
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: "8px" }}>
                {loading ? "..." : requireTotp ? "verify" : "sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Dashboard({ user, onLogout, onUpdate }: { user: UserInfo; onLogout: () => void; onUpdate: (u: UserInfo) => void }) {
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState<PostInput>(emptyPost);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState(false);

  async function load() {
    try {
      setPosts(await api.adminPosts());
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e.status === 401) onLogout();
    }
  }

  useEffect(() => { load(); }, []);

  function startNew() {
    setEditing(null);
    setForm(emptyPost);
    setMsg("");
    setPreview(false);
    setTab("editor");
  }

  function startEdit(p: Post) {
    setEditing(p);
    setForm({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      tag: p.tag,
      cover_url: p.cover_url || "",
      seo_title: p.seo_title || "",
      seo_description: p.seo_description || "",
      published: p.published,
    });
    setMsg("");
    setPreview(false);
    setTab("editor");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      if (editing) await api.updatePost(editing.id, form);
      else await api.createPost(form);
      await load();
      setTab("posts");
    } catch (err: unknown) {
      setMsg((err as Error).message);
    }
  }

  async function remove(p: Post) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    await api.deletePost(p.id);
    await load();
  }

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-header">
          <div className="admin-header-left">
            <span className="admin-kicker">control plane</span>
            <h2>TerminalExplore admin</h2>
            <p>{user.email}</p>
          </div>
          <div className="admin-actions">
            {tab !== "posts" && <button className="btn-nav" onClick={() => setTab("posts")}>back</button>}
            {tab === "posts" && <button className="btn-primary" onClick={startNew}>+ new post</button>}
            <button className="btn-nav" onClick={() => setTab("cases")}>cases</button>
            <button className="btn-nav" onClick={() => setTab("stats")}>stats</button>
            <button className="btn-nav" onClick={() => setTab("backups")}>backups</button>
            <button className="btn-nav" onClick={() => setTab("settings")}>settings</button>
            <button className="btn-ghost" onClick={onLogout}>logout</button>
          </div>
        </div>

        {tab === "posts" && (
          <div className="admin-list">
            {posts.length === 0 && <p className="dim-sm">no posts yet.</p>}
            {posts.map((p) => (
              <div className="admin-item" key={p.id} onClick={() => startEdit(p)}>
                <div className="admin-item-head">
                  <div className="admin-item-title">{p.title}</div>
                  <span className={`badge ${p.published ? "badge-published" : "badge-draft"}`}>{p.published ? "published" : "draft"}</span>
                </div>
                <div className="admin-item-excerpt">{p.excerpt}</div>
                <div className="admin-item-meta">
                  <span>/{p.slug}</span>
                  <span>{p.tag || "notes"}</span>
                  <span>{p.created_at}</span>
                </div>
                <div style={{ marginTop: "10px" }}>
                  <button type="button" className="btn-ghost" onClick={(e) => { e.stopPropagation(); remove(p); }}>delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "editor" && (
          <form className="admin-card admin-editor" onSubmit={save}>
            <div className="admin-editor-head">
              <div className="admin-card-title">{editing ? "edit post" : "new post"}</div>
              <button type="button" className="btn-nav" onClick={() => setPreview(!preview)}>
                {preview ? "edit" : "preview"}
              </button>
            </div>

            {!preview ? (
              <>
                <Field label="title">
                  <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </Field>
                <div className="form-grid">
                  <Field label="slug">
                    <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="my-post-slug" />
                  </Field>
                  <Field label="tag">
                    <input className="input" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="docker" />
                  </Field>
                </div>
                <Field label="excerpt">
                  <input className="input" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
                </Field>
                <Field label="cover image url">
                  <input className="input" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." />
                </Field>
                <ImageUpload onUploaded={(url) => setForm({ ...form, cover_url: url })} />
                <div className="form-grid">
                  <Field label="seo title">
                    <input className="input" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
                  </Field>
                  <Field label="seo description">
                    <input className="input" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
                  </Field>
                </div>
                <Field label="content (markdown)">
                  <textarea className="input" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
                </Field>
              </>
            ) : (
              <article className="post-preview">
                {form.cover_url && <img className="post-cover" src={form.cover_url} alt="" />}
                <h1>{form.title || "Untitled post"}</h1>
                {form.excerpt && <p className="post-excerpt">{form.excerpt}</p>}
                <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }} />
              </article>
            )}

            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", cursor: "pointer" }}>
              <input type="checkbox" checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked ? 1 : 0 })} />
              <span style={{ fontSize: "0.88rem" }}>published</span>
            </label>
            {msg && <div className="admin-msg admin-msg-error">{msg}</div>}
            <button type="submit" className="btn-primary">{editing ? "update" : "create"}</button>
          </form>
        )}

        {tab === "settings" && <Settings user={user} onUpdate={onUpdate} />}
        {tab === "cases" && <CasesAdmin />}
        {tab === "stats" && <StatsPanel />}
        {tab === "backups" && <BackupsPanel />}
      </div>
    </section>
  );
}

function CasesAdmin() {
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [editing, setEditing] = useState<CaseStudy | null>(null);
  const [form, setForm] = useState<CaseInput>(emptyCase);
  const [msg, setMsg] = useState("");

  async function load() {
    setItems(await api.adminCases());
  }

  useEffect(() => { load().catch(() => {}); }, []);

  function edit(item: CaseStudy) {
    setEditing(item);
    setForm({
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      problem: item.problem,
      solution: item.solution,
      result: item.result,
      stack: item.stack,
      metric: item.metric,
      published: item.published,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      if (editing) await api.updateCase(editing.id, form);
      else await api.createCase(form);
      setEditing(null);
      setForm(emptyCase);
      await load();
    } catch (err: unknown) {
      setMsg((err as Error).message);
    }
  }

  async function remove(item: CaseStudy) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    setMsg("");
    try {
      await api.deleteCase(item.id);
      if (editing?.id === item.id) {
        setEditing(null);
        setForm(emptyCase);
      }
      await load();
      setMsg("case deleted");
    } catch (err: unknown) {
      setMsg((err as Error).message);
    }
  }

  return (
    <div className="admin-layout">
      <div className="admin-card">
        <div className="admin-editor-head">
          <div className="admin-card-title">cases</div>
          <button className="btn-nav" onClick={() => { setEditing(null); setForm(emptyCase); }}>new</button>
        </div>
        <div className="admin-list">
          {items.map((item) => (
            <div className="admin-item" key={item.id} onClick={() => edit(item)}>
              <div className="admin-item-title">{item.title}</div>
              <div className="admin-item-excerpt">{item.summary}</div>
              <div className="admin-item-meta">
                <span>/{item.slug}</span>
                <span>{item.metric}</span>
                <span className={`badge ${item.published ? "badge-published" : "badge-draft"}`}>{item.published ? "published" : "draft"}</span>
              </div>
              <button type="button" className="btn-ghost" onClick={(e) => { e.stopPropagation(); remove(item); }}>delete</button>
            </div>
          ))}
        </div>
        {msg && <div className={`admin-msg ${msg === "case deleted" ? "admin-msg-success" : "admin-msg-error"}`}>{msg}</div>}
      </div>
      <form className="admin-card" onSubmit={save}>
        <div className="admin-card-title">{editing ? "edit case" : "new case"}</div>
        <Field label="title"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
        <div className="form-grid">
          <Field label="slug"><input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
          <Field label="metric"><input className="input" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} placeholder="99.9% uptime" /></Field>
        </div>
        <Field label="stack"><input className="input" value={form.stack} onChange={(e) => setForm({ ...form, stack: e.target.value })} /></Field>
        <Field label="summary"><textarea className="input" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} required /></Field>
        <Field label="problem"><textarea className="input" value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} /></Field>
        <Field label="solution"><textarea className="input" value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} /></Field>
        <Field label="result"><textarea className="input" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} /></Field>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", cursor: "pointer" }}>
          <input type="checkbox" checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked ? 1 : 0 })} />
          <span style={{ fontSize: "0.88rem" }}>published</span>
        </label>
        {msg && <div className="admin-msg admin-msg-error">{msg}</div>}
        <button className="btn-primary">{editing ? "update" : "create"}</button>
      </form>
    </div>
  );
}

function ImageUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [msg, setMsg] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setMsg("uploading...");
    try {
      const data = await api.uploadImage(file);
      onUploaded(data.url);
      setMsg(`uploaded: ${data.url}`);
    } catch (err: unknown) {
      setMsg((err as Error).message);
    }
  }

  return (
    <div className="form-group">
      <label>upload cover image</label>
      <input className="input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => upload(e.target.files?.[0])} />
      {msg && <div className="dim-sm">{msg}</div>}
    </div>
  );
}

function StatsPanel() {
  const [data, setData] = useState<{ total: number; today: number; top: { path: string; views: number }[]; recent: { path: string; referrer: string; created_at: string }[] } | null>(null);

  useEffect(() => {
    api.statsSummary().then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="admin-card">loading stats...</div>;

  return (
    <div className="admin-card">
      <div className="admin-card-title">traffic</div>
      <div className="stats-grid">
        <div><span className="label">total</span><strong>{data.total}</strong></div>
        <div><span className="label">today</span><strong>{data.today}</strong></div>
      </div>
      <div className="admin-card-title">top pages</div>
      <div className="admin-list">
        {data.top.map((row) => (
          <div className="admin-item" key={row.path}>
            <div className="admin-item-title">{row.path}</div>
            <div className="admin-item-meta"><span>{row.views} views</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackupsPanel() {
  const [items, setItems] = useState<BackupInfo[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setItems(await api.backups());
  }

  useEffect(() => { load().catch(() => {}); }, []);

  async function create() {
    setMsg("");
    try {
      await api.createBackup();
      await load();
      setMsg("backup created");
    } catch (err: unknown) {
      setMsg((err as Error).message);
    }
  }

  async function restore(name: string) {
    if (!confirm(`Restore ${name}? API restart will be required.`)) return;
    await api.restoreBackup(name);
    setMsg("backup restored; restart API container");
  }

  return (
    <div className="admin-card">
      <div className="admin-editor-head">
        <div className="admin-card-title">backups</div>
        <button className="btn-primary" onClick={create}>create backup</button>
      </div>
      {msg && <div className="admin-msg admin-msg-success">{msg}</div>}
      <div className="admin-list">
        {items.map((item) => (
          <div className="admin-item" key={item.name}>
            <div className="admin-item-title">{item.name}</div>
            <div className="admin-item-meta">
              <span>{Math.round(item.size / 1024)} KB</span>
              <span>{item.created_at}</span>
              <a href={`/api/admin/backups/${encodeURIComponent(item.name)}`} onClick={(e) => e.stopPropagation()}>download</a>
            </div>
            <button className="btn-ghost" onClick={() => restore(item.name)}>restore</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Settings({ user, onUpdate }: { user: UserInfo; onUpdate: (u: UserInfo) => void }) {
  const [tab, setTab] = useState<"2fa" | "info" | "email" | "password">("info");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [emailError, setEmailError] = useState("");
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passError, setPassError] = useState("");

  async function setup() {
    setError("");
    setMsg("");
    try {
      const data = await api.setup2fa();
      setQr(data.qr);
      setSecret(data.secret);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await api.verify2fa(code);
      setMsg("2FA enabled successfully");
      setQr("");
      setSecret("");
      setCode("");
      onUpdate({ ...user, totpEnabled: true });
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setEmailMsg("");
    try {
      const data = await api.changeEmail(newEmail, emailPassword);
      setEmailMsg("Email updated");
      setNewEmail("");
      setEmailPassword("");
      onUpdate(data.user);
    } catch (err: unknown) {
      setEmailError((err as Error).message);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPassError("");
    setPassMsg("");
    if (newPass !== confirmPass) {
      setPassError("Passwords do not match");
      return;
    }
    try {
      await api.changePassword(curPass, newPass);
      setPassMsg("Password changed");
      setCurPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err: unknown) {
      setPassError((err as Error).message);
    }
  }

  return (
    <div className="admin-layout">
      <div className="admin-card">
        <div className="admin-card-title">account</div>
        <SettingsRow label="Email" desc={user.email} button="change" onClick={() => setTab("email")} />
        <SettingsRow label="Password" desc="************" button="change" onClick={() => setTab("password")} />
        <SettingsRow label="two-factor auth" desc={user.totpEnabled ? "enabled" : "disabled"} button={user.totpEnabled ? "manage" : "enable"} onClick={() => setTab("2fa")} />
      </div>

      {tab === "email" && (
        <div className="admin-card">
          <div className="admin-card-title">change email</div>
          <form onSubmit={changeEmail}>
            <Field label="new email">
              <input className="input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            </Field>
            <Field label="current password">
              <input className="input" type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} required />
            </Field>
            {emailError && <div className="admin-msg admin-msg-error">{emailError}</div>}
            {emailMsg && <div className="admin-msg admin-msg-success">{emailMsg}</div>}
            <button type="submit" className="btn-primary">update email</button>
          </form>
        </div>
      )}

      {tab === "password" && (
        <div className="admin-card">
          <div className="admin-card-title">change password</div>
          <form onSubmit={changePassword}>
            <Field label="current password">
              <input className="input" type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} required />
            </Field>
            <Field label="new password">
              <input className="input" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required minLength={12} />
            </Field>
            <Field label="confirm new password">
              <input className="input" type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required />
            </Field>
            {passError && <div className="admin-msg admin-msg-error">{passError}</div>}
            {passMsg && <div className="admin-msg admin-msg-success">{passMsg}</div>}
            <button type="submit" className="btn-primary">change password</button>
          </form>
        </div>
      )}

      {tab === "2fa" && (
        <div className="admin-card">
          <div className="admin-card-title">{user.totpEnabled ? "2fa settings" : "enable 2fa"}</div>
          {!user.totpEnabled && !qr && (
            <div className="twofa-setup">
              <p style={{ marginBottom: "20px", fontSize: "0.88rem", color: "var(--text-mid)" }}>
                Add an extra layer of security with an authenticator app.
              </p>
              <button className="btn-primary" onClick={setup}>set up 2fa</button>
            </div>
          )}
          {qr && (
            <div className="twofa-setup">
              <div className="twofa-qr"><img src={qr} alt="QR Code" /></div>
              <div className="twofa-secret">{secret}</div>
              <form onSubmit={verify}>
                <Field label="verification code">
                  <input className="input" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required />
                </Field>
                {error && <div className="admin-msg admin-msg-error">{error}</div>}
                {msg && <div className="admin-msg admin-msg-success">{msg}</div>}
                <button type="submit" className="btn-primary" style={{ width: "100%" }}>verify & enable</button>
              </form>
            </div>
          )}
          {user.totpEnabled && !qr && (
            <div style={{ textAlign: "center" }}>
              <div className="admin-msg admin-msg-success" style={{ marginBottom: "16px" }}>2fa is active</div>
              <button className="btn-danger" onClick={() => {
                if (!confirm("Disable 2FA?")) return;
                const p = prompt("Enter password to confirm:");
                if (p) api.disable2fa(p).then(() => onUpdate({ ...user, totpEnabled: false })).catch((err) => setError(err.message));
              }}>disable 2fa</button>
              {error && <div className="admin-msg admin-msg-error">{error}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsRow({ label, desc, button, onClick }: { label: string; desc: string; button: string; onClick: () => void }) {
  return (
    <div className="settings-row">
      <div>
        <div className="settings-label">{label}</div>
        <div className="settings-desc">{desc}</div>
      </div>
      <button className="btn-nav" onClick={onClick}>{button}</button>
    </div>
  );
}
