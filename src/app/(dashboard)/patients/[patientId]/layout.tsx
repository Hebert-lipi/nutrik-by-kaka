"use client";

import { PatientWorkspaceShell } from "@/components/patients/patient-workspace-shell";

export default function PatientWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { patientId: string };
}) {
  return <PatientWorkspaceShell patientId={params.patientId}>{children}</PatientWorkspaceShell>;
}
