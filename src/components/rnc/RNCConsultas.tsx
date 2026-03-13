import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MOCK_RNCS, COMPANIES, SECTORS } from '@/types/qms';
import type { RNCStatus, Criticality } from '@/types/qms';

const statusLabels: Record<RNCStatus, string> = {
  'aberta': 'Aberta', 'triagem': 'Triagem', 'analise-causa': 'Análise de Causa',
  'plano-acao': 'Plano de Ação', 'validacao': 'Validação', 'implementacao': 'Implementação',
  'eficacia': 'Eficácia', 'concluida': 'Concluída', 'recusada': 'Recusada',
};

const critColors: Record<Criticality, string> = {
  baixa: 'bg-risk-low-light text-risk-low',
  media: 'bg-risk-medium-light text-risk-medium',
  alta: 'bg-risk-high-light text-risk-high',
};

export default function RNCConsultas() {
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterSector, setFilterSector] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = MOCK_RNCS.filter((r) => {
    if (search && !r.subject.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCompany !== 'all' && r.company !== filterCompany) return false;
    if (filterSector !== 'all' && r.sector !== filterSector) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-xl font-semibold text-foreground mb-4">Consultas</h1>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por ID ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Empresa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Empresas</SelectItem>
            {COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSector} onValueChange={setFilterSector}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Setores</SelectItem>
            {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Assunto</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Criticidade</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Responsável</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rnc) => (
              <tr key={rnc.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-medium text-primary">{rnc.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(rnc.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 max-w-[300px] truncate">{rnc.subject}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="text-xs">{statusLabels[rnc.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={critColors[rnc.criticality] + ' border-0 text-xs'}>
                    {rnc.criticality === 'baixa' ? 'Baixa' : rnc.criticality === 'media' ? 'Média' : 'Alta'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{rnc.approver}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma ocorrência encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
