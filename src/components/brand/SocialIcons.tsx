import { cn } from "@/lib/cn";

interface IconProps {
  className?: string;
}

export function KakaoIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
      aria-hidden
    >
      <path d="M12 3C6.48 3 2 6.52 2 10.88c0 2.77 1.85 5.2 4.64 6.6-.2.7-.72 2.6-.83 3-.14.5.18.5.38.36.15-.1 2.42-1.64 3.4-2.3.8.12 1.6.18 2.41.18 5.52 0 10-3.52 10-7.88S17.52 3 12 3z" />
    </svg>
  );
}

export function GoogleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
      aria-hidden
    >
      <path
        d="M21.35 11.1H12v2.94h5.37c-.25 1.4-1.04 2.58-2.22 3.38v2.81h3.58c2.1-1.93 3.3-4.77 3.3-8.13 0-.7-.06-1.37-.17-2z"
        fill="#4285F4"
      />
      <path
        d="M12 22c3 0 5.52-1 7.36-2.72l-3.58-2.8c-1 .68-2.26 1.07-3.78 1.07-2.9 0-5.36-1.96-6.24-4.6H2.1v2.88A10 10 0 0 0 12 22z"
        fill="#34A853"
      />
      <path
        d="M5.76 12.95A5.99 5.99 0 0 1 5.44 11c0-.68.12-1.34.32-1.95V6.17H2.1A10 10 0 0 0 1 11c0 1.61.39 3.14 1.1 4.48l3.66-2.53z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.4c1.64 0 3.1.57 4.25 1.67l3.18-3.18C17.5 1.24 15 0 12 0 7.7 0 4 2.47 2.1 6.17l3.66 2.88C6.65 6.37 9.1 4.4 12 4.4z"
        fill="#EA4335"
      />
    </svg>
  );
}
