import { Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MOCK_RISKS } from '@/types/qms';
import type { RiskStatus } from '@/types/qms';

const statusLabels: Record<RiskStatus, string> = {
  'em-andamento': 'Em Andamento',
  'concluido': 'Concluído',
  'iniciar': 'Iniciar',
  'sem-previsao': 'Sem Previsão',
  'acao-constante': 'Ação Constante',
};

const classConfig: Record<string, { label: string; className: string }> = {
  baixo: { label: 'Baixo', className: 'bg-risk-low-light text-risk-low' },
  medio: { label: 'Médio', className: 'bg-risk-medium-light text-risk-medium' },
  alto: { label: 'Alto', className: 'bg-risk-high-light text-risk-high' },
};

export default function RiskPendingList() {
  const pending = MOCK_RISKS.filter(r => r.status !== 'concluido');

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Pendências</h1>
        <p className="text-sm text-muted-foreground mt-1">Riscos que requerem ação</p>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma pendência encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((risk) => {
            const cls = classConfig[risk.riskClassification];
            return (
              <div key={risk.id} className="bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-primary">{risk.id}</span>
                      <Badge variant="outline" className={cls.className + ' border-0 text-xs'}>
                        {cls.label} ({risk.riskLevel})
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{statusLabels[risk.status]}</Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{risk.risk}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Causa: {risk.cause}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Prazo: {new Date(risk.deadline).toLocaleDateString('pt-BR')}
                      </span>
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
