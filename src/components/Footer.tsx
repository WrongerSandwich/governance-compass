export function Footer() {
  return (
    <footer className="border-t border-border-secondary px-7 py-5">
      <div className="max-w-shell mx-auto flex flex-wrap items-center justify-between gap-2 mono-meta text-text-label">
        <span data-footer-group="privacy">Privacy-first &middot; No data sold</span>
        <span data-footer-group="provenance">
          <a
            href="https://github.com/WrongerSandwich/governance-compass"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors duration-150 focus-ring"
          >
            Source on GitHub
          </a>
          {" · "}
          <a
            href="https://polyformproject.org/licenses/noncommercial/1.0.0/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Licence: PolyForm Noncommercial"
            className="hover:text-text-secondary transition-colors duration-150 focus-ring"
          >
            PolyForm Noncommercial
          </a>
        </span>
      </div>
    </footer>
  );
}
