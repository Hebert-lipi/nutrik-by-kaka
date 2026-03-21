import { Pill } from "./pill";

export type DietPlanStatus = "draft" | "published";

export function StatusPill({ status }: { status: DietPlanStatus }) {
  if (status === "published") return <Pill tone="primary">Publicado</Pill>;
  return <Pill tone="yellow">Rascunho</Pill>;
}

