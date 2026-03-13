import { Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type RNCStatus = Database['public']['Enums']['rnc_status'];
type CritLevel = Database['public']['Enums']['criticality_level'];

const statusLabels: Record<RNCStatus, string> = {
  aberta: 'Aberta', triagem: 'Triagem', analise_causa: 'Análise de Causa',
  plano_acao: 'Plano de Ação', validacao: 'Validação', implementacao: 'Implementação',
  eficacia: 'Eficácia', concluida: 'Concluída', recusada: 'Recusada',
};

const critConfig: Record<CritLevel, { label: string; className: string }> = {
  baixa: { label: 'Baixa', className: 'bg-risk-low-light text-risk-low' },
  media: { label: 'Média', className: 'bg-risk-medium-light text-risk-medium' },
  alta: { label: 'Alta', className: 'bg-risk-high-light text-risk-high' },
};

export default function RNCPendingList() {
  const { setSelectedRNCId } = useModule();
  const { user } = useAuth();

  const { data: rncs = [], isLoading } = useQuery({
    queryKey: ['rnc-list', 'pending'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rnc_occurrences')
        .select('*, companies(name), sectors(name)')
        .not('status', 'in', '("concluida","recusada")')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-map'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name');
      return data || [];
    },
  });

  const getProfileName = (userId: string) => profiles.find(p => p.user_id === userId)?.full_name || '';

  if (isLoading) {
    return <div className="p-6"><div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-lg" />)}</div></div>;
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Pendências</h1>
        <p className="text-sm text-muted-foreground mt-1">RNCs aguardando sua ação</p>
      </div>

      {rncs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma pendência encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rncs.map((rnc) => {
            const crit = critConfig[rnc.criticality];
            return (
              <div key={rnc.id} onClick={() => setSelectedRNCId(rnc.id)}
                className="bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-primary">{rnc.code}</span>
                      <Badge variant="outline" className={crit.className + ' border-0 text-xs'}>{crit.label}</Badge>
                      <Badge variant="secondary" className="text-xs">{statusLabels[rnc.status]}</Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{rnc.subject}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{(rnc.companies as any)?.name} • {(rnc.sectors as any)?.name}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(rnc.occurrence_date).toLocaleDateString('pt-BR')}
                      </span>
                      <span>Aprovador: {getProfileName(rnc.approver_id)}</span>
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
