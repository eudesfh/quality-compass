import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useModule } from '@/contexts/ModuleContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';
import FilterSidebar, { FilterValues } from '@/components/filters/FilterSidebar';

type RNCStatus = Database['public']['Enums']['rnc_status'];
type CritLevel = Database['public']['Enums']['criticality_level'];

const statusLabels: Record<RNCStatus, string> = {
  aberta: 'Aberta', triagem: 'Triagem', analise_causa: 'Análise de Causa',
  plano_acao: 'Plano de Ação', validacao: 'Validação', implementacao: 'Implementação',
  eficacia: 'Eficácia', concluida: 'Concluída', recusada: 'Recusada',
};

const critColors: Record<CritLevel, string> = {
  baixa: 'bg-risk-low-light text-risk-low',
  media: 'bg-risk-medium-light text-risk-medium',
  alta: 'bg-risk-high-light text-risk-high',
};

const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));

export default function RNCConsultas() {
  const { setSelectedRNCId } = useModule();
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

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-map'],
    queryFn: async () => { const { data } = await supabase.from('profiles').select('user_id, full_name'); return data || []; },
  });

  const { data: rncs = [] } = useQuery({
    queryKey: ['rnc-list', 'all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rnc_occurrences')
        .select('*, companies(name), sectors(name)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const getProfileName = (userId: string) => profiles.find(p => p.user_id === userId)?.full_name || '';

  const filtered = rncs.filter((r) => {
    if (search && !r.subject.toLowerCase().includes(search.toLowerCase()) && !r.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.company !== 'all' && r.company_id !== filters.company) return false;
    if (filters.sector !== 'all' && r.sector_id !== filters.sector) return false;
    if (filters.status !== 'all' && r.status !== filters.status) return false;
    if (filters.companyType !== 'all' && r.company_type !== filters.companyType) return false;
    if (filters.dateFrom && r.occurrence_date < filters.dateFrom) return false;
    if (filters.dateTo && r.occurrence_date > filters.dateTo) return false;
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
        title="Filtros — RNC"
      />
      <div className="flex-1 p-6">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-semibold text-foreground">Consultas</h1>
          <div className="relative flex-1 max-w-md ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por código ou assunto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Assunto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Criticidade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rnc) => (
                <tr key={rnc.id} onClick={() => setSelectedRNCId(rnc.id)}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{rnc.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(rnc.occurrence_date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 max-w-[300px] truncate">{rnc.subject}</td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{statusLabels[rnc.status]}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={critColors[rnc.criticality] + ' border-0 text-xs'}>
                      {rnc.criticality === 'baixa' ? 'Baixa' : rnc.criticality === 'media' ? 'Média' : 'Alta'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{getProfileName(rnc.approver_id)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma ocorrência encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
