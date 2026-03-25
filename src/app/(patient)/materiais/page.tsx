import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";

export default function PatientMateriaisPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Paciente</p>
        <h1 className="mt-1 text-title16 font-semibold text-text-primary md:text-h4">Materiais</h1>
      </div>
      <Card className="border-neutral-200/70 bg-white/95 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.03]">
        <CardHeader className="border-b border-neutral-100/80">
          <p className="text-body14 font-semibold text-text-primary">Em breve</p>
          <p className="mt-1 text-small12 text-text-secondary">Conteúdos de apoio e materiais da sua nutricionista ficarão disponíveis aqui.</p>
        </CardHeader>
        <CardContent className="pt-5">
          <Link href="/meu-plano" className={buttonClassName("primary", "md", "inline-flex justify-center")}>
            Ir para plano alimentar
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
