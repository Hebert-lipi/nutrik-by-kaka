"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NewPatientWizardInput } from "@/hooks/use-supabase-patients";
import type { PatientSex } from "@/lib/draft-storage";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-4 text-sm font-semibold text-text-primary shadow-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewPatientWizardInput) => Promise<void>;
};

export function PatientAddWizardModal({ open, onClose, onSubmit }: Props) {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [sex, setSex] = React.useState<PatientSex | "">("");
  const [clinicalNotes, setClinicalNotes] = React.useState("");
  const [portalAccessActive, setPortalAccessActive] = React.useState(true);
  const [portalCanDietPlan, setPortalCanDietPlan] = React.useState(true);
  const [portalCanRecipes, setPortalCanRecipes] = React.useState(true);
  const [portalCanMaterials, setPortalCanMaterials] = React.useState(true);
  const [portalCanShopping, setPortalCanShopping] = React.useState(true);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  function reset() {
    setStep(1);
    setName("");
    setEmail("");
    setPhone("");
    setBirthDate("");
    setSex("");
    setClinicalNotes("");
    setPortalAccessActive(true);
    setPortalCanDietPlan(true);
    setPortalCanRecipes(true);
    setPortalCanMaterials(true);
    setPortalCanShopping(true);
    setFormError(null);
    setSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function nextFromStep1() {
    const n = name.trim();
    const em = email.trim();
    if (!n || !em || !em.includes("@")) {
      setFormError("Informe nome completo e um e-mail válido.");
      return;
    }
    setFormError(null);
    setStep(2);
  }

  async function finish(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const em = email.trim();
    if (!n || !em || !em.includes("@")) {
      setFormError("Informe nome completo e um e-mail válido.");
      setStep(1);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({
        name: n,
        email: em,
        phone: phone.trim(),
        birthDate: birthDate.trim() || null,
        sex: sex === "" ? null : sex,
        clinicalNotes: clinicalNotes.trim(),
        portalAccessActive,
        portalCanDietPlan,
        portalCanRecipes,
        portalCanMaterials,
        portalCanShopping,
      });
      handleClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo paciente"
      description="Cadastro em etapas — dados clínicos e permissões do app."
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-3">
          <Button type="button" variant="outline" className="rounded-xl" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {step === 2 ? (
              <Button type="button" variant="secondary" className="rounded-xl" onClick={() => setStep(1)}>
                Voltar
              </Button>
            ) : null}
            {step === 1 ? (
              <Button type="button" variant="primary" className="rounded-xl" onClick={nextFromStep1}>
                Continuar
              </Button>
            ) : (
              <Button type="submit" form="patient-wizard-form" variant="primary" className="rounded-xl" disabled={saving}>
                {saving ? "Salvando…" : "Concluir cadastro"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="mb-4 flex gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              step >= s ? "bg-primary" : "bg-neutral-200/90",
            )}
          />
        ))}
      </div>
      <p className="mb-4 text-small12 font-bold text-text-secondary">
        Etapa {step} de 2 · {step === 1 ? "Dados básicos" : "Acesso ao app"}
      </p>

      <form id="patient-wizard-form" className="space-y-4" onSubmit={step === 2 ? finish : (e) => e.preventDefault()}>
        {formError ? (
          <p className="rounded-xl border border-orange/30 bg-orange/10 px-3 py-2 text-small12 font-semibold text-text-secondary">
            {formError}
          </p>
        ) : null}

        {step === 1 ? (
          <>
            <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            <Input
              label="E-mail"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="Telefone / WhatsApp"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="Opcional"
            />
            <div className="space-y-2">
              <label htmlFor="birth-date" className="block text-small12 font-bold uppercase tracking-wide text-text-muted">
                Data de nascimento
              </label>
              <input
                id="birth-date"
                type="date"
                className={selectClass}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="sex" className="block text-small12 font-bold uppercase tracking-wide text-text-muted">
                Sexo
              </label>
              <select id="sex" className={selectClass} value={sex} onChange={(e) => setSex(e.target.value as PatientSex | "")}>
                <option value="">Prefiro não informar</option>
                <option value="female">Feminino</option>
                <option value="male">Masculino</option>
                <option value="other">Outro</option>
                <option value="unspecified">Não especificado</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="wiz-notes" className="block text-small12 font-bold uppercase tracking-wide text-text-muted">
                Observações
              </label>
              <textarea
                id="wiz-notes"
                rows={3}
                className="w-full resize-y rounded-xl border border-neutral-200/90 bg-bg-0 px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                placeholder="Anotações internas, alertas, preferências…"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/40 p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary"
                checked={portalAccessActive}
                onChange={(e) => setPortalAccessActive(e.target.checked)}
              />
              <span>
                <span className="block text-sm font-semibold text-text-primary">Acesso ao app ativo</span>
                <span className="mt-0.5 block text-small12 font-semibold text-text-secondary">
                  Quando desligado, as permissões abaixo ficam sem efeito até reativar.
                </span>
              </span>
            </label>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">O paciente pode ver:</p>
            <div className="space-y-2 rounded-xl border border-neutral-200/70 bg-bg-0 p-3">
              {[
                ["Plano alimentar", portalCanDietPlan, setPortalCanDietPlan] as const,
                ["Receitas", portalCanRecipes, setPortalCanRecipes] as const,
                ["Materiais", portalCanMaterials, setPortalCanMaterials] as const,
                ["Lista de compras", portalCanShopping, setPortalCanShopping] as const,
              ].map(([label, checked, set]) => (
                <label key={label} className="flex cursor-pointer items-center gap-3 py-1.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-primary"
                    checked={checked}
                    onChange={(e) => set(e.target.checked)}
                    disabled={!portalAccessActive}
                  />
                  <span className="text-sm font-semibold text-text-primary">{label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
