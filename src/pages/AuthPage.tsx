import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-10 w-10 mx-auto text-primary mb-2" />
          <CardTitle className="text-xl">SGQ — Sistema de Gestão da Qualidade</CardTitle>
          <CardDescription>Faça login para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processando...' : 'Entrar'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Para alterar sua senha, entre no sistema e use a opção <span className="font-medium text-foreground">Alterar senha</span> no menu da conta.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Não tem acesso? Solicite já seu usuário ao administrador.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
