import { Component, ErrorInfo, ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import styles from "./ErrorBoundary.module.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasResetKeyChanged) {
        this.reset();
      }
    }
    if (this.state.hasError && this.props.resetOnPropsChange) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className={styles.container} role="alert">
          <div className={styles.icon} aria-hidden="true"><TriangleAlert size={32} /></div>
          <h2 className={styles.title}>Something went wrong</h2>
          <p className={styles.message}>
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          {this.state.error && (
            <details className={styles.details}>
              <summary>Error details</summary>
              <pre className={styles.errorText}>
                {this.state.error.message}
                {this.state.error.stack && "\n\n" + this.state.error.stack}
              </pre>
            </details>
          )}
          <button className={styles.retryButton} onClick={this.reset}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}