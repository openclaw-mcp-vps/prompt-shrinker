"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccessClaimForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClaim = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Enter the same email used during Stripe checkout.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to unlock access.");
      }

      toast.success("Access granted. Redirecting to dashboard...");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to unlock access.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleClaim} className="space-y-3">
      <label htmlFor="claim-email" className="text-sm text-slate-300">
        Already paid? Enter your checkout email to unlock your workspace.
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="claim-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
        />
        <Button type="submit" disabled={isLoading} className="sm:w-44">
          {isLoading ? "Checking..." : "Unlock Access"}
        </Button>
      </div>
    </form>
  );
}
