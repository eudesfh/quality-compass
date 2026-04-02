-- Adiciona política de DELETE para permitir que a exclusão funcione no frontend
CREATE POLICY "Enable delete for authenticated users" ON public.rnc_occurrences
FOR DELETE
TO authenticated
USING (true);
