import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">

          <div className="text-6xl mb-6">⚠️</div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            An unexpected error occurred. Please try refreshing the page.
          </p>

          {this.state.error && (
            <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-8 font-mono text-left">
              {this.state.error.message}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => this.handleReset()}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white
                         px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-gray-200
                         text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Go Home
            </a>
          </div>

        </div>
      </div>
    );
  }
}

export default ErrorBoundary;