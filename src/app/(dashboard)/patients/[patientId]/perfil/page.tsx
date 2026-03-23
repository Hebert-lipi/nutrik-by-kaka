"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Chip } from "@/components/ui/chip";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import type { NutritionActivityLevel, NutritionGoal, PatientClinicalStatus, PatientSex } from "@/lib/draft-storage";
import { formatPatientDateTime, patientAgeFromBirthDate } from "@/lib/patients/patient-display";

const selectClass =
  "h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-4 text-sm font-semibold text-text-primary shadow-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15";

const STATUS_LABEL: Record<PatientClinicalStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
};

export default function PatientPerfilPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients, updatePatient, loading } = useSupabasePatients();
  const patient = patients.find((p) => p.id === patientId);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [sex, setSex] = React.useState<PatientSex | "">("");
  const [clinicalNotes, setClinicalNotes] = React.useState("");
  const [weightKg, setWeightKg] = React.useState<string>("");
  const [heightCm, setHeightCm] = React.useState<string>("");
  const [activityLevel, setActivityLevel] = React.useState<NutritionActivityLevel | "">("");
  const [nutritionGoal, setNutritionGoal] = React.useState<NutritionGoal | "">("");
  const [clinicalStatus, setClinicalStatus] = React.useState<PatientClinicalStatus>("active");
  const [portalAccessActive, setPortalAccessActive] = React.useState(true);
  const [portalCanDietPlan, setPortalCanDietPlan] = React.useState(true);
  const [portalCanRecipes, setPortalCanRecipes] = React.useState(true);
  const [portalCanMaterials, setPortalCanMaterials] = React.useState(true);
  const [portalCanShopping, setPortalCanShopping] = React.useState(true);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!patient) return;
    setName(patient.name);
    setEmail(patient.email);
    setPhone(patient.phone ?? "");
    setBirthDate(patient.birthDate ?? "");
    setSex(patient.sex ?? "");
    setClinicalNotes(patient.clinicalNotes ?? "");
    setWeightKg(patient.weightKg != null ? String(patient.weightKg) : "");
    setHeightCm(patient.heightCm != null ? String(patient.heightCm) : "");
    setActivityLevel(patient.activityLevel ?? "");
    setNutritionGoal(patient.nutritionGoal ?? "");
    setClinicalStatus(patient.clinicalStatus ?? "active");
    setPortalAccessActive(patient.portalAccessActive !== false);
    setPortalCanDietPlan(patient.portalCanDietPlan !== false);
    setPortalCanRecipes(patient.portalCanRecipes !== false);
    setPortalCanMaterials(patient.portalCanMaterials !== false);
    setPortalCanShopping(patient.portalCanShopping !== false);
  }, [patient]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !patientId) return;
    if (window.location.hash === "#observacoes") {
      const el = document.getElementById("observacoes");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [patientId, patient]);

  if (!patientId) {
    return (
      <EmptyState title="Paciente inválido" action={{ label: "Voltar", onClick: () => router.push("/patients") }} />
    );
  }

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-body14 font-semibold text-text-muted">Carregando…</div>;
  }

  if (!patient) {
    return (
      <EmptyState
        title="Paciente não encontrado"
        action={{ label: "Pacientes", onClick: () => router.push("/patients") }}
      />
    );
  }

  const age = patientAgeFromBirthDate(birthDate || patient.birthDate || null);

  async function saveProfile() {
    if (!patient) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updatePatient(patient.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        birthDate: birthDate.trim() || null,
        sex: sex === "" ? null : sex,
        weightKg: weightKg.trim() === "" ? null : Number(weightKg),
        heightCm: heightCm.trim() === "" ? null : Number(heightCm),
        activityLevel: activityLevel === "" ? null : activityLevel,
        nutritionGoal: nutritionGoal === "" ? null : nutritionGoal,
        clinicalNotes: clinicalNotes.trim(),
        clinicalStatus,
        portalAccessActive,
        portalCanDietPlan,
        portalCanRecipes,
        portalCanMaterials,
        portalCanShopping,
      });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Perfil</p>
        <h2 className="mt-1 text-title16 font-semibold text-text-primary md:text-h4">Dados cadastrais</h2>
        <p className="mt-2 text-small12 font-semibold text-text-secondary">
          Base fixa do paciente. Última sincronização: {formatPatientDateTime(patient.updatedAt ?? patient.createdAt, "—")}
          {age !== null ? ` · ${age} anos` : ""}
        </p>
      </div>

      {saveError ? (
        <p className="rounded-xl border border-orange/30 bg-orange/10 px-4 py-3 text-small12 font-bold text-text-secondary">{saveError}</p>
      ) : null}

      <Card className="border-neutral-200/55 shadow-premium-sm">
        <CardHeader className="border-b border-neutral-100/90 pb-4">
          <p className="text-title16 font-semibold text-text-primary">Dados pessoais</p>
          <p className="mt-1 text-small12 font-semibold text-text-secondary">Identificação e contato clínico</p>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Telefone / WhatsApp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="space-y-2">
            <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Data de nascimento</label>
            <input type="date" className={selectClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Sexo</label>
            <select className={selectClass} value={sex} onChange={(e) => setSex(e.target.value as PatientSex | "")}>
              <option value="">Prefiro não informar</option>
              <option value="female">Feminino</option>
              <option value="male">Masculino</option>
              <option value="other">Outro</option>
              <option value="unspecified">Não especificado</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Status clínico (diretório)</label>
            <select
              className={selectClass}
              value={clinicalStatus}
              onChange={(e) => setClinicalStatus(e.target.value as PatientClinicalStatus)}
            >
              <option value="active">{STATUS_LABEL.active}</option>
              <option value="paused">{STATUS_LABEL.paused}</option>
              <option value="archived">{STATUS_LABEL.archived}</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <p className="mb-1 text-small12 font-bold uppercase tracking-wide text-text-muted">Base nutricional (motor de prescrição)</p>
            <p className="text-small12 font-semibold text-text-secondary">Dados usados para TMB/GET no construtor de dieta. Pode ajustar por paciente.</p>
          </div>
          <Input label="Peso atual (kg)" type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          <Input label="Altura (cm)" type="number" step="0.1" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          <div className="space-y-2">
            <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Nível de atividade</label>
            <select className={selectClass} value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as NutritionActivityLevel | "")}>
              <option value="">Selecione</option>
              <option value="sedentary">Sedentário</option>
              <option value="light">Leve</option>
              <option value="moderate">Moderado</option>
              <option value="intense">Intenso</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Objetivo nutricional padrão</label>
            <select className={selectClass} value={nutritionGoal} onChange={(e) => setNutritionGoal(e.target.value as NutritionGoal | "")}>
              <option value="">Selecione</option>
              <option value="weight_loss">Emagrecimento</option>
              <option value="maintenance">Manutenção</option>
              <option value="muscle_gain">Ganho de massa</option>
            </select>
          </div>
          <div id="observacoes" className="md:col-span-2 scroll-mt-28 space-y-2">
            <label htmlFor="clinical-notes" className="block text-small12 font-bold uppercase tracking-wide text-text-muted">
              Observações clínicas
            </label>
            <textarea
              id="clinical-notes"
              rows={6}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Evolução, alertas, preferências alimentares, exames relevantes…"
              className="w-full resize-y rounded-xl border border-neutral-200/90 bg-bg-0 px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 shadow-premium-sm ring-1 ring-primary/10">
        <CardHeader className="border-b border-neutral-100/90 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="primary" className="font-semibold">
              Portal
            </Chip>
            <p className="text-title16 font-semibold text-text-primary">Permissões do app</p>
          </div>
          <p className="mt-2 text-small12 font-semibold leading-relaxed text-text-secondary">
            Controle fino do que o paciente poderá acessar quando os módulos estiverem no app. Não altera o login em{" "}
            <span className="font-mono text-[11px]">/meu-plano</span> nesta versão.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary"
              checked={portalAccessActive}
              onChange={(e) => setPortalAccessActive(e.target.checked)}
            />
            <span>
              <span className="block text-sm font-semibold text-text-primary">Acesso ao app ativo</span>
              <span className="mt-0.5 block text-small12 font-semibold text-text-secondary">Desligar suspende a experiência do paciente até reativar.</span>
            </span>
          </label>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Permitir visualizar</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["Plano alimentar", portalCanDietPlan, setPortalCanDietPlan] as const,
              ["Receitas", portalCanRecipes, setPortalCanRecipes] as const,
              ["Materiais", portalCanMaterials, setPortalCanMaterials] as const,
              ["Lista de compras", portalCanShopping, setPortalCanShopping] as const,
            ].map(([label, checked, set]) => (
              <label key={label} className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200/70 bg-bg-0 p-3.5 shadow-inner">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-primary"
                  checked={checked}
                  onChange={(e) => set(e.target.checked)}
                  disabled={!portalAccessActive}
                />
                <span className="text-sm font-bold text-text-primary">{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        variant="primary"
        size="lg"
        className="h-12 w-full rounded-full font-semibold sm:w-auto sm:px-12"
        disabled={saving}
        onClick={() => void saveProfile()}
      >
        {saving ? "Salvando…" : "Salvar alterações"}
      </Button>
    </div>
  );
}
