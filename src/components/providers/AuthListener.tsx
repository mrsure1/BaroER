"use client";

import { useEffect } from "react";
import { startAuthListener } from "@/services/auth";

export function AuthListener() {
  useEffect(() => {
    const unsub = startAuthListener();
    return () => unsub();
  }, []);
  return null;
}
