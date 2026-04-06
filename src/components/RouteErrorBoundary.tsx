import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
          <div className="text-center max-w-md p-6">
            <h2 className="text-xl font-bold text-foreground mb-2">حدث خطأ في هذه الصفحة</h2>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'خطأ غير متوقع'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset}>إعادة المحاولة</Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                العودة للرئيسية
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
