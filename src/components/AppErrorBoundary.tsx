import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

const DEFAULT_MESSAGE =
  'Something went wrong while loading the app. You can reload the page or return to the home page.';

const normalizeErrorMessage = (value: unknown) => {
  if (value instanceof Error && value.message.trim()) {
    return value.message;
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return DEFAULT_MESSAGE;
};

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: DEFAULT_MESSAGE,
  };

  private handleWindowError = (event: ErrorEvent) => {
    if (!event.error && !event.message) {
      return;
    }

    console.error('Unhandled window error:', event.error || event.message);
    this.setState({
      hasError: true,
      message: normalizeErrorMessage(event.error || event.message),
    });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason);
    this.setState({
      hasError: true,
      message: normalizeErrorMessage(event.reason),
    });
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: normalizeErrorMessage(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App render error:', error, errorInfo);
  }

  componentDidMount() {
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7f6f3_0%,#ffffff_45%,#eef1ff_100%)] px-6 py-12">
        <div className="w-full max-w-xl rounded-[32px] border border-gray-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Application Error</p>
          <h1 className="mt-3 text-3xl font-semibold text-gray-900">The app hit an unexpected problem.</h1>
          <p className="mt-4 text-sm leading-6 text-gray-600">{this.state.message || DEFAULT_MESSAGE}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-full bg-[#12108b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d0b68]"
            >
              <RefreshCcw className="h-4 w-4" />
              Reload App
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
