"use client";

import { useEffect, useRef } from "react";
import { useToastManager } from "@/components/ui/toast";

export function ToastMessage({ message, type = "error" }: { message: string; type?: "success" | "error" | "info" }) {
  const toast = useToastManager();
  const shown = useRef("");
  useEffect(() => {
    if (shown.current === message) return;
    shown.current = message;
    toast.add({ title: message, type });
  }, [message, type, toast]);
  return null;
}
