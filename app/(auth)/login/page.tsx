"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      const token = await login(email, password);
      localStorage.setItem("token", token);
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="hidden xl:flex flex-60"></div>

      {/* RIGHT PANEL */}
      <div className="flex-40 flex flex-col items-center justify-center bg-white">
        <div className="flex flex-col gap-2 items-center w-full max-w-sm px-8">
          <Image
            src="/staredesk-logo.svg"
            alt="StareDesk"
            width={100}
            height={100}
            loading="eager"
            className="object-cover h-70 w-auto"
          />

          <div className="flex flex-col gap-1 w-full">
            <label className="font-bold tracking-wide">Email address</label>
            <input
              type="email"
              placeholder="user@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-2 px-3 py-2 rounded-[5px] shadow-sm shadow-gray-800 placeholder:font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="font-bold tracking-wide">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="border-2 px-3 py-2 rounded-[5px] shadow-sm shadow-gray-800 placeholder:font-semibold"
            />
          </div>

          {error && <p className="text-red-500 text-sm w-full">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="border-2 flex w-fit justify-center px-12 py-2 mt-4 items-center font-bold bg-[#FDB833] rounded-[5px] hover:bg-[#e8960f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:bg-red-500"
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>
        </div>
      </div>
    </div>
  );
}
