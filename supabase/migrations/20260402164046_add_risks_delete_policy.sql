CREATE POLICY "Users delete own risks" ON public.risks
FOR DELETE TO authenticated
USING (
  auth.uid() = created_by 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND role = 'admin'
  )
);
