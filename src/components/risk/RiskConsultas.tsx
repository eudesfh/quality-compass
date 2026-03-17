import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';
import FilterSidebar, { FilterValues } from '@/components/filters/FilterSidebar';

type RiskStatus = Database['public']['Enums']['risk_status'];

const statusLabels: Record<RiskStatus, string> = {
  em_andamento: 'Em Andamento', concluido: 'Concluído', iniciar: 'Iniciar',
  sem_previsao: 'Sem Previsão', acao_constante: 'Ação Constante',
};

const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));

const getRiskClass = (level: number) => {
  if (level <= 2) return { label: 'Baixo', className: 'bg-risk-low-light text-risk-low' };
  if (level <= 5) return { label: 'Médio', className: 'bg-risk-medium-light text-risk-medium' };
  return { label: 'Alto', className: 'bg-risk-high-light text-risk-high' };
};

export default function RiskConsultas() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: '', dateTo: '', company: 'all', companyType: 'all', sector: 'all', status: 'all',
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => { const { data } = await supabase.from('companies').select('*'); return data || []; },
  });

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => { const { data } = await supabase.from('sectors').select('*'); return data || []; },
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risk-list', 'all'],
    queryFn: async () => {
      const { data } = await supabase.from('risks').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const filtered = risks.filter((r) => {
    if (search && !r.risk_description.toLowerCase().includes(search.toLowerCase()) && !r.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.status !== 'all' && r.status !== filters.status) return false;
    if (filters.company !== 'all' && r.company_id !== filters.company) return false;
    if (filters.companyType !== 'all' && (r as any).company_type !== filters.companyType) return false;
    if (filters.sector !== 'all' && r.sector_id !== filters.sector) return false;
    if (filters.dateFrom && r.created_at.split('T')[0] < filters.dateFrom) return false;
    if (filters.dateTo && r.created_at.split('T')[0] > filters.dateTo) return false;
    return true;
  });

  return (
    <div className="flex animate-fade-in">
      <FilterSidebar
        filters={filters}
        onChange={setFilters}
        companies={companies}
        sectors={sectors}
        statusOptions={statusOptions}
        title="Filtros — Riscos"
      />
      <div className="flex-1 p-6">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-semibold text-foreground">Consultas — Riscos</h1>
          <div className="relative flex-1 max-w-md ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Risco</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nível</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Resposta</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prazo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((risk) => {
                const level = risk.risk_level || (risk.probability * risk.severity);
                const cls = getRiskClass(level);
                return (
                  <tr key={risk.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{risk.code}</td>
                    <td className="px-4 py-3 max-w-[300px] truncate">{risk.risk_description}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={cls.className + ' border-0 text-xs'}>{cls.label} ({level})</Badge></td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{risk.response}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{statusLabels[risk.status]}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{risk.deadline ? new Date(risk.deadline).toLocaleDateString('pt-BR') : '—'}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum risco encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
