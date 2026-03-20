import { Pill } from "./pill";

export type DietPlanStatus = "draft" | "published";

export function StatusPill({ status }: { status: DietPlanStatus }) {
  if (status === "published") return <Pill tone="primary">Published</Pill>;
  return <Pill tone="yellow">Draft</Pill>;
}

