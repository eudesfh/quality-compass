import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-card border rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Ocorreu um erro inesperado</h2>
            <p className="text-sm text-muted-foreground">
              A tela encontrou um problema, mas você não precisa perder seu trabalho. Tente voltar ou recarregar a página.
            </p>
            {this.state.error?.message && (
              <pre className="text-xs bg-muted p-2 rounded max-h-32 overflow-auto text-muted-foreground">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={this.handleReset}>Tentar novamente</Button>
              <Button onClick={this.handleReload}>Recarregar</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
