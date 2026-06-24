import { Link } from "react-router-dom";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} Orivaz. Every property has an origin.</p>
        <nav className="flex flex-wrap items-center gap-4">
          <Link to="/why" className="hover:text-foreground">About</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/disclaimer" className="hover:text-foreground">Disclaimer</Link>
        </nav>
      </div>
    </footer>
  );
}
