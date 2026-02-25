import { Heart } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(window.location.hostname || 'trusttrack-app');

  return (
    <footer className="bg-footer-bg border-t border-footer-border text-footer-fg py-6 mt-auto print:hidden">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-primary">TrustTrack</span>
        <span className="text-muted-foreground">© {year} TrustTrack. All rights reserved.</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </span>
      </div>
    </footer>
  );
}
