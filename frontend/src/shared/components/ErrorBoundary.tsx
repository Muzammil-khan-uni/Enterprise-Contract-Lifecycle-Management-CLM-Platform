import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-slate-50 dark:bg-ink-950 flex items-center justify-center p-6 text-slate-900 dark:text-white">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-ambient dark:border-ink-800 dark:bg-ink-900 dark:shadow-ambient-dark">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600 dark:bg-danger-600/15 dark:text-danger-400">
            <AlertTriangle size={22} aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-brass-600 dark:text-brass-300">CLM Platform</p>
          <h1 className="mt-2 font-display text-xl font-semibold text-ink-950 dark:text-white">Something went wrong</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            The application encountered an unexpected problem. Reload the page to continue.
          </p>
          <Button type="button" size="sm" className="mt-5" onClick={this.handleReload}>
            <RefreshCw size={15} aria-hidden="true" />
            Reload application
          </Button>
        </section>
      </main>
    );
  }
}
