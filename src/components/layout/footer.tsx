export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-black/60 dark:text-white/60 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-pal-red" />
        <span className="h-2 w-2 rounded-full bg-pal-black dark:bg-white" />
        <span className="h-2 w-2 rounded-full bg-pal-green" />
        <span className="h-2 w-2 rounded-full bg-pal-gold" />
      </div>
        <div>© {new Date().getFullYear()} MADDAD</div>
        <div>نلتزم بخصوصية بيانات المتبرعين والمستفيدين.</div>
      </div>
    </footer>
  );
}
