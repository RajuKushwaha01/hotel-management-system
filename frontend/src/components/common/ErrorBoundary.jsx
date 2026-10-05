import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// Catches any render-time crash anywhere in the app and shows the real error on screen
// instead of a blank white page. This is what was missing — every "blank page" bug
// report so far has actually been a silent crash with no visible feedback.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', padding: 24 }}>
          <div style={{ maxWidth: 700, width: '100%', background: '#111827', borderRadius: 16, padding: 32, color: '#F8FAFC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <AlertTriangle color="#EF4444" size={24} />
              <h1 style={{ fontSize: 20, margin: 0 }}>Something crashed on this page</h1>
            </div>
            <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 12 }}>
              Copy the text below exactly — this tells us precisely what's broken:
            </p>
            <pre style={{
              background: '#020617', padding: 16, borderRadius: 10, fontSize: 12,
              overflowX: 'auto', color: '#FCA5A5', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.info?.componentStack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 20, display: 'flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg,#C9A227,#E8D48A)', color: '#0F172A',
                border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <RotateCcw size={16} /> Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
