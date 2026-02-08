import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-black text-center p-4">
                    <h1 className="text-4xl font-bold text-red-500 mb-4">Something went wrong.</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
                        We're sorry, but the application encountered an unexpected error.
                        Please try refreshing the page.
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        >
                            Refresh Page
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-6 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                        >
                            Go Home
                        </button>
                    </div>
                    {process.env.NODE_ENV === 'development' && (
                        <pre className="mt-8 p-4 bg-gray-800 text-red-300 rounded text-left overflow-auto max-w-2xl text-sm">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
