import { Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useModule } from '@/contexts/ModuleContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type RiskStatus = Database['public']['Enums']['risk_status'];

const statusLabels: Record<RiskStatus, string> = {
  em_andamento: 'Em Andamento', concluido: 'Concluído', iniciar: 'Iniciar',
  sem_previsao: 'Sem Previsão', acao_constante: 'Ação Constante',
};

const classConfig: Record<string, { label: string; className: string }> = {
  1: { label: 'Baixo', className: 'bg-risk-low-light text-risk-low' },
  2: { label: 'Baixo', className: 'bg-risk-low-light text-risk-low' },
  3: { label: 'Médio', className: 'bg-risk-medium-light text-risk-medium' },
  4: { label: 'Médio', className: 'bg-risk-medium-light text-risk-medium' },
  5: { label: 'Médio', className: 'bg-risk-medium-light text-risk-medium' },
  6: { label: 'Alto', className: 'bg-risk-high-light text-risk-high' },
  7: { label: 'Alto', className: 'bg-risk-high-light text-risk-high' },
  8: { label: 'Alto', className: 'bg-risk-high-light text-risk-high' },
  9: { label: 'Alto', className: 'bg-risk-high-light text-risk-high' },
};

export default function RiskPendingList() {
  const { setSelectedRiskId } = useModule();
  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risk-list', 'pending'],
    queryFn: async () => {
      const { data } = await supabase
        .from('risks')
        .select('*')
        .not('status', 'eq', 'concluido')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="p-6"><div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-lg" />)}</div></div>;
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Pendências</h1>
        <p className="text-sm text-muted-foreground mt-1">Riscos que requerem ação</p>
      </div>

      {risks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma pendência encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map((risk) => {
            const level = risk.risk_level || (risk.probability * risk.severity);
            const cls = classConfig[String(level)] || classConfig['1'];
            return (
              <div key={risk.id} onClick={() => setSelectedRiskId(risk.id)}
                className="bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-primary">{risk.code}</span>
                      <Badge variant="outline" className={cls.className + ' border-0 text-xs'}>{cls.label} ({level})</Badge>
                      <Badge variant="secondary" className="text-xs">{statusLabels[risk.status]}</Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{risk.risk_description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Causa: {risk.cause}</span>
                      {risk.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Prazo: {new Date(risk.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
