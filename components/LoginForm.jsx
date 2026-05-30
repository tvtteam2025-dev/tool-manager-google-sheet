"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn, User } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();

    setLoading(false);
    if (!result.success) {
      setError(result.message || "Không đăng nhập được.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="authForm" onSubmit={submitLogin}>
      <label className="field">
        <span>Tài khoản</span>
        <div className="inputWithIcon">
          <User size={17} />
          <input
            autoComplete="username"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            required
          />
        </div>
      </label>
      <label className="field">
        <span>Mật khẩu</span>
        <div className="inputWithIcon">
          <LockKeyhole size={17} />
          <input
            autoComplete="current-password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
        </div>
      </label>
      {error ? <div className="alert error">{error}</div> : null}
      <button className="btn primary full" disabled={loading} type="submit">
        <LogIn size={17} />
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
