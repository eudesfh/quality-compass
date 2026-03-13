import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function RNCDashboard() {
  const { data: rncs = [] } = useQuery({
    queryKey: ['rnc-list', 'all'],
    queryFn: async () => {
      const { data } = await supabase.from('rnc_occurrences').select('*, sectors(name)');
      return data || [];
    },
  });

  const total = rncs.length;
  const pending = rncs.filter(r => !['concluida', 'recusada'].includes(r.status)).length;
  const concluded = rncs.filter(r => r.status === 'concluida').length;

  const statusCounts: Record<string, number> = {};
  const sectorCounts: Record<string, number> = {};
  const critCounts = { baixa: 0, media: 0, alta: 0 };

  rncs.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    const sectorName = (r.sectors as any)?.name || 'Outro';
    sectorCounts[sectorName] = (sectorCounts[sectorName] || 0) + 1;
    critCounts[r.criticality]++;
  });

  const statusLabels: Record<string, string> = {
    aberta: 'Aberta', triagem: 'Triagem', analise_causa: 'Análise',
    plano_acao: 'Plano', validacao: 'Validação', implementacao: 'Impl.',
    eficacia: 'Eficácia', concluida: 'Concluída', recusada: 'Recusada',
  };

  const statusData = Object.entries(statusCounts).map(([k, v]) => ({ name: statusLabels[k] || k, value: v }));
  const sectorData = Object.entries(sectorCounts).map(([k, v]) => ({ name: k, value: v }));
  const critData = [
    { name: 'Baixa', value: critCounts.baixa, color: 'hsl(142, 72%, 35%)' },
    { name: 'Média', value: critCounts.media, color: 'hsl(37, 91%, 44%)' },
    { name: 'Alta', value: critCounts.alta, color: 'hsl(0, 74%, 50%)' },
  ];

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-xl font-semibold text-foreground mb-6">Visão Geral — RNC</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total de RNCs', value: total },
          { label: 'Pendentes', value: pending },
          { label: 'Concluídas', value: concluded },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold text-foreground">{kpi.value}</p>
              <p className="text-sm font-medium text-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {total > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Por Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(0, 74%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Por Criticidade</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={critData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {critData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader><CardTitle className="text-base">Por Setor</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sectorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(0, 74%, 50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">Nenhuma RNC registrada ainda</p>
      )}
    </div>
  );
}
