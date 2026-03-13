import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function RiskDashboard() {
  const { data: risks = [] } = useQuery({
    queryKey: ['risk-list', 'all'],
    queryFn: async () => {
      const { data } = await supabase.from('risks').select('*');
      return data || [];
    },
  });

  const total = risks.length;
  const classCount = { baixo: 0, medio: 0, alto: 0 };
  const statusCounts: Record<string, number> = {};

  risks.forEach(r => {
    const level = r.risk_level || (r.probability * r.severity);
    if (level <= 2) classCount.baixo++;
    else if (level <= 5) classCount.medio++;
    else classCount.alto++;
    const statusMap: Record<string, string> = {
      em_andamento: 'Em Andamento', concluido: 'Concluído', iniciar: 'Iniciar',
      sem_previsao: 'Sem Previsão', acao_constante: 'Ação Constante',
    };
    const label = statusMap[r.status] || r.status;
    statusCounts[label] = (statusCounts[label] || 0) + 1;
  });

  const classData = [
    { name: 'Baixo', value: classCount.baixo, color: 'hsl(142, 72%, 35%)' },
    { name: 'Médio', value: classCount.medio, color: 'hsl(37, 91%, 44%)' },
    { name: 'Alto', value: classCount.alto, color: 'hsl(0, 74%, 50%)' },
  ];
  const statusData = Object.entries(statusCounts).map(([k, v]) => ({ name: k, value: v }));

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-xl font-semibold text-foreground mb-6">Visão Geral — Gestão de Riscos</h1>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: total },
          { label: 'Alto Risco', value: classCount.alto },
          { label: 'Médio Risco', value: classCount.medio },
          { label: 'Baixo Risco', value: classCount.baixo },
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
            <CardHeader><CardTitle className="text-base">Classificação dos Riscos</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={classData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {classData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Riscos por Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(37, 91%, 44%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">Nenhum risco cadastrado ainda</p>
      )}
    </div>
  );
}
