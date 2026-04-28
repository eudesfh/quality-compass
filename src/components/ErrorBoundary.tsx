import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

// Erros transitórios de DOM causados por extensões do navegador
// (Google Translate, Grammarly, etc.) que mexem na árvore de nós.
// Não são bugs do app — recuperamos silenciosamente.
const isTransientDomError = (err: Error | null): boolean => {
  if (!err?.message) return false;
  const m = err.message;
  return (
    m.includes("removeChild") ||
    m.includes("insertBefore") ||
    m.includes("The node to be removed") ||
    m.includes("The node before which the new node is to be inserted")
  );
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[ErrorBoundary]', error, info);
    if (isTransientDomError(error)) {
      // Auto-recupera no próximo tick — força um re-render limpo.
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 0);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Erros transitórios: não mostra tela de erro — espera auto-recuperar.
      if (isTransientDomError(this.state.error)) {
        return null;
      }
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
