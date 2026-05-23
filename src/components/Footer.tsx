export function Footer() {
  return (
    <footer className="border-t border-border-secondary px-4 py-5">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-text-tertiary">
        <a
          href="https://github.com/WrongerSandwich/governance-compass"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-secondary transition-colors duration-150"
        >
          Source on GitHub
        </a>
        <span className="opacity-30">&middot;</span>
        <span>
          Source-available under{" "}
          <a
            href="https://polyformproject.org/licenses/noncommercial/1.0.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors duration-150"
          >
            PolyForm Noncommercial
          </a>
        </span>
        <span className="opacity-30">&middot;</span>
        <span>Privacy-first &middot; No data sold</span>
      </div>
    </footer>
  );
}
