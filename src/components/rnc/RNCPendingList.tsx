import { Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MOCK_RNCS } from '@/types/qms';
import type { RNCStatus, Criticality } from '@/types/qms';

const statusLabels: Record<RNCStatus, string> = {
  'aberta': 'Aberta',
  'triagem': 'Triagem',
  'analise-causa': 'Análise de Causa',
  'plano-acao': 'Plano de Ação',
  'validacao': 'Validação',
  'implementacao': 'Implementação',
  'eficacia': 'Eficácia',
  'concluida': 'Concluída',
  'recusada': 'Recusada',
};

const criticalityConfig: Record<Criticality, { label: string; className: string }> = {
  baixa: { label: 'Baixa', className: 'bg-risk-low-light text-risk-low' },
  media: { label: 'Média', className: 'bg-risk-medium-light text-risk-medium' },
  alta: { label: 'Alta', className: 'bg-risk-high-light text-risk-high' },
};

export default function RNCPendingList() {
  const pendingRncs = MOCK_RNCS.filter(r => r.status !== 'concluida' && r.status !== 'recusada');

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Pendências</h1>
        <p className="text-sm text-muted-foreground mt-1">RNCs aguardando sua ação</p>
      </div>

      {pendingRncs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma pendência encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRncs.map((rnc) => {
            const crit = criticalityConfig[rnc.criticality];
            return (
              <div key={rnc.id} className="bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-primary">{rnc.id}</span>
                      <Badge variant="outline" className={crit.className + ' border-0 text-xs'}>
                        {crit.label}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {statusLabels[rnc.status]}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{rnc.subject}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{rnc.company} • {rnc.sector}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(rnc.date).toLocaleDateString('pt-BR')}
                      </span>
                      <span>Responsável: {rnc.approver}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
