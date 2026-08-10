import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RNCDashboard() {
  const { isAdmin } = useAuth();
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');

  const { data: rncs = [] } = useQuery({
    queryKey: ['rnc-list', 'all'],
    queryFn: async () => {
      const { data } = await supabase.from('rnc_occurrences').select('*, sectors(name)');
      return data || [];
    },
  });

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data } = await supabase.from('sectors').select('*').order('name');
      return data || [];
    },
  });

  // Filter RNCs based on the selected sector
  const filteredRncs = rncs.filter((r) => {
    if (selectedSector !== 'all' && r.sector_id !== selectedSector) return false;
    if (selectedOrigin !== 'all' && r.origin !== selectedOrigin) return false;
    return true;
  });

  const originList = Array.from(new Set(rncs.map((r: any) => r.origin).filter(Boolean))).sort();

  const total = filteredRncs.length;
  const pending = filteredRncs.filter(r => !['concluida', 'recusada'].includes(r.status)).length;
  const concluded = filteredRncs.filter(r => r.status === 'concluida').length;

  const statusCounts: Record<string, number> = {};
  const sectorCounts: Record<string, number> = {};
  const originCounts: Record<string, number> = {};
  const typeCounts = { real: 0, oportunidade: 0, potencial: 0 };
  const critCounts = { baixa: 0, media: 0, alta: 0 };

  filteredRncs.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    const sectorName = (r.sectors as any)?.name || 'Outro';
    sectorCounts[sectorName] = (sectorCounts[sectorName] || 0) + 1;
    const originName = r.origin || 'Não Informada';
    originCounts[originName] = (originCounts[originName] || 0) + 1;
    if (r.criticality in critCounts) {
      critCounts[r.criticality as keyof typeof critCounts]++;
    }
    if (r.occurrence_type in typeCounts) {
      typeCounts[r.occurrence_type as keyof typeof typeCounts]++;
    }
  });

  const statusLabels: Record<string, string> = {
    aberta: 'Aberta', triagem: 'Triagem', analise_causa: 'Análise',
    plano_acao: 'Plano', validacao: 'Validação', implementacao: 'Impl.',
    eficacia: 'Eficácia', concluida: 'Concluída', recusada: 'Recusada',
  };

  const statusData = Object.entries(statusCounts).map(([k, v]) => ({ name: statusLabels[k] || k, value: v }));
  const sectorData = Object.entries(sectorCounts).map(([k, v]) => ({ name: k, value: v }));
  const originData = Object.entries(originCounts).map(([k, v]) => ({ name: k, value: v }));
  const critData = [
    { name: 'Baixa', value: critCounts.baixa, color: 'hsl(142, 72%, 35%)' },
    { name: 'Média', value: critCounts.media, color: 'hsl(37, 91%, 44%)' },
    { name: 'Alta', value: critCounts.alta, color: 'hsl(0, 74%, 50%)' },
  ];
  const typeData = [
    { name: 'Não Conformidade (NC)', value: typeCounts.real, color: 'hsl(346, 84%, 61%)' },
    { name: 'Oportunidade', value: typeCounts.oportunidade, color: 'hsl(199, 89%, 48%)' },
  ];
  if (typeCounts.potencial > 0) {
    typeData.push({ name: 'NC Potencial', value: typeCounts.potencial, color: 'hsl(37, 91%, 44%)' });
  }

  return (
    <div className="p-6 animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Visão Geral — RNC</h1>
          <p className="text-sm text-muted-foreground">Monitore o status, criticidade, setores e origens das Não Conformidades.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3 self-start md:self-auto bg-card border rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Filtrar Setor:</span>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-[180px] h-9 border-muted bg-background hover:bg-accent transition-colors">
                <SelectValue placeholder="Todos os Setores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Setores</SelectItem>
                {sectors.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Origem:</span>
            <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
              <SelectTrigger className="w-[190px] h-9 border-muted bg-background hover:bg-accent transition-colors">
                <SelectValue placeholder="Todas as Origens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Origens</SelectItem>
                {originList.map((o: any) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total de RNCs', value: total, desc: 'Ocorrências no setor selecionado' },
          { label: 'Pendentes', value: pending, desc: 'Aguardando etapas finais', colorClass: 'text-amber-500' },
          { label: 'Concluídas', value: concluded, desc: 'Totalmente encerradas', colorClass: 'text-emerald-500' },
        ].map((kpi) => (
          <Card key={kpi.label} className="border bg-card shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-baseline justify-between">
                <p className={`text-3xl font-bold tracking-tight ${kpi.colorClass || 'text-foreground'}`}>{kpi.value}</p>
              </div>
              <p className="text-sm font-semibold text-foreground mt-2">{kpi.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {total > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border bg-card shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Por Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border bg-card shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Por Criticidade</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie 
                      data={critData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={85} 
                      paddingAngle={4} 
                      dataKey="value" 
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    >
                      {critData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border bg-card shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Por Tipo de Ocorrência</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie 
                      data={typeData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={85} 
                      paddingAngle={4} 
                      dataKey="value" 
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    >
                      {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border bg-card shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Por Setor</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sectorData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" width={110} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="hsl(262, 83%, 58%)" radius={[0, 4, 4, 0]} maxBarSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border bg-card shadow-sm">
              <CardHeader><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Por Origem</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={originData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" width={120} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="hsl(142, 72%, 29%)" radius={[0, 4, 4, 0]} maxBarSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="border bg-card rounded-lg py-16 text-center shadow-sm">
          <p className="text-muted-foreground font-medium">Nenhuma RNC registrada para os critérios selecionados.</p>
        </div>
      )}
    </div>
  );
}
