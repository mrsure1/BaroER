import { redirect } from "next/navigation";

/**
 * Root entry — in a future auth-guarded setup we'll check a session cookie
 * and forward to either /login or /home. For now we land on the dashboard
 * (unauthenticated access is allowed while we scaffold UI).
 */
export default function RootPage() {
  redirect("/home");
}
