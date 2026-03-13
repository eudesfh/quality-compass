import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOCK_RISKS } from '@/types/qms';
import type { RiskStatus } from '@/types/qms';

const statusLabels: Record<RiskStatus, string> = {
  'em-andamento': 'Em Andamento', 'concluido': 'Concluído', 'iniciar': 'Iniciar',
  'sem-previsao': 'Sem Previsão', 'acao-constante': 'Ação Constante',
};

const classConfig: Record<string, { label: string; className: string }> = {
  baixo: { label: 'Baixo', className: 'bg-risk-low-light text-risk-low' },
  medio: { label: 'Médio', className: 'bg-risk-medium-light text-risk-medium' },
  alto: { label: 'Alto', className: 'bg-risk-high-light text-risk-high' },
};

export default function RiskConsultas() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = MOCK_RISKS.filter((r) => {
    if (search && !r.risk.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-xl font-semibold text-foreground mb-4">Consultas — Riscos</h1>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por ID ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Risco</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nível</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Resposta</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prazo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((risk) => {
              const cls = classConfig[risk.riskClassification];
              return (
                <tr key={risk.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{risk.id}</td>
                  <td className="px-4 py-3 max-w-[300px] truncate">{risk.risk}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cls.className + ' border-0 text-xs'}>{cls.label} ({risk.riskLevel})</Badge>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{risk.response}</td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{statusLabels[risk.status]}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(risk.deadline).toLocaleDateString('pt-BR')}</td>
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
  );
}
