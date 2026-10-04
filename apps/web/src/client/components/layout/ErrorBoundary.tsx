import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcwIcon, TriangleAlertIcon } from 'lucide-react';
import { referenceId } from '../../utils/ids';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** When this value changes (e.g. the route), the boundary clears its error. */
  resetKey?: string;
  fullScreen?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
  reference: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, reference: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, reference: referenceId() };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', this.state.reference, error, info.componentStack);
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null, reference: '' });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const isChunk = /loading chunk|dynamically imported module|failed to fetch/i.test(this.state.error.message);
    const content =
    <ErrorState
      icon={TriangleAlertIcon}
      title={isChunk ? 'This page could not load' : 'This page ran into a problem'}
      description={isChunk ? 'Check your connection, then reload. Your saved work is safe.' : 'Your saved work is safe. Try again, or go back to the dashboard.'}
      reference={this.state.reference}
      actions={
      <>
            <Button variant="primary" icon={RotateCcwIcon} onClick={() => isChunk ? window.location.reload() : this.setState({ error: null, reference: '' })}>
              Try again
            </Button>
            <Button onClick={() => window.location.assign('/dashboard')}>Go to dashboard</Button>
          </>
      } />;


    return this.props.fullScreen ? <div className="flex min-h-screen w-full items-center justify-center bg-canvas">{content}</div> : content;
  }
}