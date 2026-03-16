import { CalendarIcon, RotateCcw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface FilterValues {
  dateFrom: string;
  dateTo: string;
  company: string;
  companyType: string;
  sector: string;
  status: string;
}

interface FilterSidebarProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  companies: { id: string; name: string }[];
  sectors: { id: string; name: string }[];
  statusOptions: { value: string; label: string }[];
  title?: string;
}

export default function FilterSidebar({ filters, onChange, companies, sectors, statusOptions, title = 'Filtros' }: FilterSidebarProps) {
  const update = (key: keyof FilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clearAll = () => {
    onChange({ dateFrom: '', dateTo: '', company: 'all', companyType: 'all', sector: 'all', status: 'all' });
  };

  const hasFilters = filters.dateFrom || filters.dateTo || filters.company !== 'all' || filters.companyType !== 'all' || filters.sector !== 'all' || filters.status !== 'all';

  return (
    <aside className="w-64 shrink-0 bg-card border-r min-h-[calc(100vh-7rem)] p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 px-2 text-xs gap-1">
            <RotateCcw className="h-3 w-3" /> Limpar
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Data Inicial</Label>
        <Input type="date" value={filters.dateFrom} onChange={(e) => update('dateFrom', e.target.value)} className="h-9 text-sm" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Data Final</Label>
        <Input type="date" value={filters.dateTo} onChange={(e) => update('dateTo', e.target.value)} className="h-9 text-sm" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Empresa</Label>
        <Select value={filters.company} onValueChange={(v) => update('company', v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tipo Empresa</Label>
        <Select value={filters.companyType} onValueChange={(v) => update('companyType', v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="obra">Obra</SelectItem>
            <SelectItem value="escritorio">Escritório</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Setor</Label>
        <Select value={filters.sector} onValueChange={(v) => update('sector', v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {sectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select value={filters.status} onValueChange={(v) => update('status', v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </aside>
  );
}
