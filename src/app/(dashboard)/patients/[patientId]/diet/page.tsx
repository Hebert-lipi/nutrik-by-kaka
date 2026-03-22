import { redirect } from "next/navigation";

/** Rota legada: cardápio passou a viver no módulo Plano alimentar. */
export default function PatientDietRedirectPage({ params }: { params: { patientId: string } }) {
  redirect(`/patients/${params.patientId}/plano`);
}
