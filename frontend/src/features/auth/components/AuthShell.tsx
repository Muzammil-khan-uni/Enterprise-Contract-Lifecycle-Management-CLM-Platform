import type { ReactNode } from 'react';
import { ShieldCheck, GitBranch, Workflow } from 'lucide-react';
import { ThemeToggle } from '../../../shared/components/ui/ThemeToggle';

const HIGHLIGHTS = [
  { icon: Workflow, text: 'Multi-level approvals with automatic escalation' },
  { icon: ShieldCheck, text: 'Full audit trail on every contract, every change' },
  { icon: GitBranch, text: 'Version history with rollback, built in' },
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-ink-950 transition-colors duration-200">
      <div className="hidden lg:flex lg:w-[42%] lg:min-w-[420px] bg-ink-950 flex-col justify-between px-12 py-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />
        {

}
        <div
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brass-500/10 blur-3xl pointer-events-none animate-pulse"
          style={{ animationDuration: '6s' }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-2.5 animate-fade-in-up">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brass-500 font-display text-base font-bold text-ink-950">
            C
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-white">CLM Platform</span>
        </div>

        <div className="relative">
          <p className="font-display text-3xl xl:text-4xl font-medium leading-[1.15] text-white animate-fade-in-up">
            Contract lifecycle management, built for how legal teams actually work.
          </p>
          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                className="flex items-center gap-3 text-slate-300 text-sm animate-fade-in-up"
                style={{ animationDelay: `${100 + i * 80}ms`, animationFillMode: 'backwards' }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-800 transition-transform hover:scale-110">
                  <Icon size={15} className="text-brass-400" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} CLM Platform</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-950 font-display text-sm font-bold text-brass-400">
              C
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink-950 dark:text-white">CLM Platform</span>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-card border border-slate-200 dark:bg-ink-900 dark:border-ink-800 dark:shadow-card-dark transition-colors duration-200">
            <h1 className="font-display text-2xl font-semibold text-ink-950 dark:text-white mb-1">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{subtitle}</p>}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
