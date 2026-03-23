/** Rotas da área clínica do paciente (nutricionista). */
export const PATIENT_WORKSPACE_TABS = [
  { segment: "", label: "Resumo" },
  { segment: "perfil", label: "Perfil" },
  { segment: "plano", label: "Plano alimentar" },
  { segment: "avaliacoes", label: "Avaliações" },
  { segment: "diario", label: "Diário" },
  { segment: "receitas", label: "Receitas" },
  { segment: "materiais", label: "Materiais" },
  { segment: "lista-compras", label: "Lista de compras" },
  { segment: "historico", label: "Histórico" },
] as const;

export function patientWorkspaceHref(patientId: string, segment: string): string {
  return segment ? `/patients/${patientId}/${segment}` : `/patients/${patientId}`;
}
