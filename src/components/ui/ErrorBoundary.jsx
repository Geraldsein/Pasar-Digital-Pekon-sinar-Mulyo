import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Terjadi kesalahan." };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F4F6F9',
          padding: '24px'
        }}>
          <div style={{
            background: 'white',
            border: '1px solid #FECACA',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(15, 44, 89, 0.12)'
          }}>
            <div style={{
              fontSize: '1.7rem', fontWeight: 800, color: '#DC2626', marginBottom: '12px'
            }}>
              Terjadi Kesalahan
            </div>
            <p style={{ fontSize: '0.95rem', color: '#64748B', marginBottom: '8px' }}>
              Halaman tidak dapat dimuat.
            </p>
            <pre style={{
              background: '#FEF2F2', color: '#991B1B', padding: '12px', borderRadius: '8px',
              fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '16px 0', textAlign: 'left'
            }}>
              {this.state.message}
            </pre>
            <button onClick={this.handleReset} style={{
              background: '#1E40AF', color: 'white', border: 'none', padding: '10px 24px',
              borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
            }}>
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}