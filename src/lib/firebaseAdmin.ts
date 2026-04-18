import "server-only";

import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let _app: App | null = null;

function readServiceAccount(): ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  // PEM keys stored in env vars commonly have escaped newlines.
  privateKey = privateKey.replace(/\\n/g, "\n");
  return { projectId, clientEmail, privateKey };
}

export function adminAvailable(): boolean {
  return readServiceAccount() !== null;
}

export function getAdminApp(): App | null {
  if (_app) return _app;
  const sa = readServiceAccount();
  if (!sa) return null;
  _app = getApps()[0] ?? initializeApp({ credential: cert(sa) });
  return _app;
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}
