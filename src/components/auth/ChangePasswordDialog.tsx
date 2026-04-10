import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'A confirmação da senha deve ser igual à nova senha.',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof changePasswordSchema>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}

export default function ChangePasswordDialog({ open, onOpenChange, userEmail }: ChangePasswordDialogProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setValues(initialValues);
      setErrors({});
      setLoading(false);
    }
  }, [open]);

  const isSubmitDisabled = useMemo(
    () => loading || !values.currentPassword || !values.newPassword || !values.confirmPassword,
    [loading, values],
  );

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = changePasswordSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FormValues | undefined;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      toast.error(parsed.error.issues[0]?.message ?? 'Revise os campos da senha.');
      return;
    }

    if (!userEmail) {
      toast.error('Não foi possível identificar o e-mail da conta atual.');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: values.currentPassword,
      });

      if (signInError) {
        setErrors({ currentPassword: 'A senha atual está incorreta.' });
        toast.error('A senha atual está incorreta.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: values.newPassword });
      if (updateError) throw updateError;

      toast.success('Senha alterada com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>
            Informe sua senha atual e defina uma nova senha com no mínimo 8 caracteres.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha atual</Label>
            <Input
              id="current-password"
              type="password"
              value={values.currentPassword}
              onChange={(e) => handleChange('currentPassword', e.target.value)}
              autoComplete="current-password"
              required
            />
            {errors.currentPassword ? <p className="text-sm text-destructive">{errors.currentPassword}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              value={values.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            {errors.newPassword ? <p className="text-sm text-destructive">{errors.newPassword}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={values.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            {errors.confirmPassword ? <p className="text-sm text-destructive">{errors.confirmPassword}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}