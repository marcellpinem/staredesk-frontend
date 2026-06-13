"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { login } from "@/lib/api";

export default function LoginClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const token = await login(email, password);

      localStorage.setItem("token", token);

      document.cookie = `token=${token}; path=/; max-age=${
        60 * 60 * 24 * 7
      }; SameSite=Strict`;

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="hidden lg:basis-[65%] lg:flex lg:items-end">
        <div className="h-200">
          <Image
            src="/logo-desktop.svg"
            alt="Logo Desktop"
            width={100}
            height={100}
            className="h-full w-full"
          />
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="flex min-h-screen w-full items-center justify-center p-6 lg:basis-[35%] lg:p-0 lg:bg-white">
        <form
          onSubmit={handleLogin}
          className="flex w-full  max-w-sm flex-col items-center justify-center gap-4 rounded-sm border-3 lg:border-none bg-white lg:bg-none border-black px-8 py-10 lg:p-0 h-full shadow-sm lg:shadow-none backdrop-blur-sm"
        >
          <Image
            src="/staredesk-logo.svg"
            alt="StareDesk"
            width={100}
            height={100}
            priority
            className="h-52 lg:h-72 w-auto object-contain"
          />

          <div className="flex w-full flex-col gap-1">
            <label htmlFor="email" className="font-bold tracking-wide">
              Email address
            </label>

            <input
              id="email"
              type="email"
              placeholder="user@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="rounded-[5px] border-2 px-3 py-2 placeholder:font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="flex w-full flex-col gap-1">
            <label htmlFor="password" className="font-bold tracking-wide">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="rounded-[5px] border-2 px-3 py-2 placeholder:font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="w-full text-sm font-medium text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-fit items-center justify-center rounded-[5px] border-2 bg-[#FDB833] px-12 py-2 font-bold transition-colors hover:bg-[#e8960f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>
        </form>
      </section>
    </>
  );
}
