"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught error:", error, info);
    this.props.onError?.(error, info);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle className="text-destructive size-8 shrink-0" />
        <p className="text-sm font-medium">Something went wrong</p>
        <p className="text-muted-foreground max-w-xs text-xs">
          {this.state.error?.message ?? "An unexpected error occurred."}
        </p>
        <Button size="sm" variant="outline" onClick={this.reset}>
          <RefreshCw className="mr-1.5 size-3.5" />
          Try again
        </Button>
      </div>
    );
  }
}
