export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-bg">
      {/* Ambient gradient — lives behind content for subtle depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-[480px] opacity-60 blur-3xl"
      >
        <div className="absolute left-1/2 top-0 aspect-square w-[640px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/40 via-primary/10 to-transparent" />
        <div className="absolute left-[-20%] top-[140px] aspect-square w-[380px] rounded-full bg-gradient-to-br from-accent/20 via-transparent to-transparent" />
      </div>
      <div className="relative flex flex-1 flex-col safe-top safe-bottom safe-x">
        {children}
      </div>
    </main>
  );
}
