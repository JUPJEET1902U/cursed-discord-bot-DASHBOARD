"use client";

import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryButton() {
  const router = useRouter();
  return (
    <Button type="button" variant="secondary" onClick={() => router.refresh()}>
      <RotateCw className="h-4 w-4" />
      Retry
    </Button>
  );
}
