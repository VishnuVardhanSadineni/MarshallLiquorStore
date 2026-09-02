"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden />
            <span className="text-xs uppercase tracking-[0.24em] font-medium">Marshall Liquor</span>
          </div>
          <h1 className="mt-3 font-heading text-4xl leading-tight text-foreground">
            Staff sign in
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Access the back-of-house inventory tools.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_20px_60px_-30px_oklch(0.35_0.08_40_/_0.3)]">
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@yourstore.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                required
              />
            </div>
            {state.error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          New team member? Ask a manager to add you.
        </p>
      </div>
    </div>
  );
}
