import { Component, type ReactNode } from 'react';

/** Shows what went wrong instead of a black screen, with a way out (reset cache / leave demo). */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('app crashed', error); }
  private async reset() {
    try {
      localStorage.removeItem('pulse-demo');
      if ('serviceWorker' in navigator) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
      if (window.caches) for (const k of await caches.keys()) await caches.delete(k);
    } finally { window.location.assign('/'); }
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="main" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1>Hoppla</h1>
        <p className="text-2">Die App konnte nicht starten. / The app could not start.</p>
        <pre className="small muted" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(this.state.error?.message ?? this.state.error)}</pre>
        <button className="btn primary block" onClick={() => void this.reset()}>Zurücksetzen & neu laden</button>
      </div>
    );
  }
}
