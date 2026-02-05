export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-pal-red" />
          <span className="h-2 w-2 rounded-full bg-foreground" />
          <span className="h-2 w-2 rounded-full bg-pal-green" />
          <span className="h-2 w-2 rounded-full bg-pal-gold" />
        </div>
        <div>© {new Date().getFullYear()} MADDAD</div>
        <div>نلتزم بخصوصية بيانات المتبرعين والمستفيدين.</div>

        <div className="mt-6 text-center">
          <div className="font-[var(--font-display)] text-lg font-bold tracking-wide bg-gradient-to-r from-pal-gold to-pal-green bg-clip-text text-transparent">
            BUILT BY MATANY LABS
          </div>
          <div className="text-sm text-muted-foreground">
            SUPPORTED BY NEXUS
          </div>
        </div>
      </div>
    </footer>
  );
}
