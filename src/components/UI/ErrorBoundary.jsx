import { Component } from "react";
import { TriangleAlert } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: "100vh", padding: 40, fontFamily: "'Inter', sans-serif", background: "#F7F8FA",
          textAlign: "center"
        }}>
          <div style={{ marginBottom: 16, color: "#E74C3C" }}><TriangleAlert size={48} /></div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A2E", margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 24px", maxWidth: 400 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#F4A026", border: "none", borderRadius: 8, padding: "10px 24px",
              fontSize: 14, fontWeight: 700, color: "#1A1A2E", cursor: "pointer"
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
