import { Component, type ErrorInfo, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[app] Unhandled rendering error", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return <main className="flex min-h-screen items-center justify-center bg-[#090A0F] p-6 text-white"><section className="glass-card max-w-lg rounded-3xl p-8 text-center"><h1 className="text-2xl font-bold">Something went wrong</h1><p className="mt-3 text-slate-300">Refresh the page to try again.</p><button className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold" onClick={() => window.location.reload()}>Refresh</button></section></main>;
    }
    return this.props.children;
  }
}
