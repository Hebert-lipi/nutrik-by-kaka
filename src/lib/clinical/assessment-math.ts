import type { NutritionActivityLevel, NutritionGoal, PatientSex } from "@/lib/draft-storage";

export type BodyFormula = "jackson_pollock_3" | "jackson_pollock_7" | "durnin_womersley" | "slaughter" | "petroski";

export type AssessmentInput = {
  sex: PatientSex | null;
  ageYears: number | null;
  weightKg: number | null;
  heightCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  // Skinfolds
  tricepsMm: number | null;
  bicepsMm: number | null;
  subscapularMm: number | null;
  suprailiacMm: number | null;
  abdominalMm: number | null;
  chestSkinfoldMm: number | null;
  midaxillaryMm: number | null;
  thighSkinfoldMm: number | null;
  calfSkinfoldMm: number | null;
  formula: BodyFormula;
};

export type BasicIndicators = {
  bmi: number | null;
  whr: number | null;
  whtr: number | null;
  idealWeightKg: number | null;
  adjustedWeightKg: number | null;
};

export type BodyCompositionResult = {
  formula: BodyFormula;
  required: string[];
  missing: string[];
  bodyDensity: number | null;
  bodyFatPct: number | null;
  fatMassKg: number | null;
  leanMassKg: number | null;
};

export type AssessmentComputed = {
  basics: BasicIndicators;
  composition: BodyCompositionResult;
};

function n(v: number | null | undefined): number | null {
  return Number.isFinite(Number(v)) ? Number(v) : null;
}

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}
function r2(v: number): number {
  return Math.round(v * 100) / 100;
}
function r5(v: number): number {
  return Math.round(v * 100000) / 100000;
}

function ageBand(age: number): "17-19" | "20-29" | "30-39" | "40-49" | "50+" {
  if (age < 20) return "17-19";
  if (age < 30) return "20-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  return "50+";
}

export function basicIndicators(input: AssessmentInput): BasicIndicators {
  const w = n(input.weightKg);
  const hCm = n(input.heightCm);
  const waist = n(input.waistCm);
  const hip = n(input.hipCm);
  const hM = hCm ? hCm / 100 : null;
  const bmi = w && hM && hM > 0 ? r2(w / (hM * hM)) : null;
  const whr = waist && hip && hip > 0 ? r2(waist / hip) : null;
  const whtr = waist && hCm && hCm > 0 ? r2(waist / hCm) : null;
  const ideal = hM ? r1(22 * hM * hM) : null;
  const adjusted = w && ideal && w > ideal ? r1(ideal + (w - ideal) * 0.25) : w ?? null;
  return { bmi, whr, whtr, idealWeightKg: ideal, adjustedWeightKg: adjusted };
}

function requiredForFormula(formula: BodyFormula): string[] {
  if (formula === "jackson_pollock_3") return ["sexo", "idade", "triceps/peitoral", "abdominal/suprailiaca", "coxa"];
  if (formula === "jackson_pollock_7") return ["sexo", "idade", "peitoral", "axilar média", "tríceps", "subescapular", "abdominal", "supra-ilíaca", "coxa"];
  if (formula === "durnin_womersley") return ["sexo", "idade", "tríceps", "bíceps", "subescapular", "supra-ilíaca"];
  if (formula === "slaughter") return ["sexo", "tríceps", "subescapular"];
  return ["sexo", "idade", "tríceps", "subescapular", "supra-ilíaca", "panturrilha"];
}

function densityByFormula(input: AssessmentInput): number | null {
  const sex = input.sex;
  const age = n(input.ageYears);
  if (!sex || sex === "other" || sex === "unspecified") return null;

  if (input.formula === "jackson_pollock_3") {
    if (!age) return null;
    if (sex === "male") {
      const chest = n(input.chestSkinfoldMm);
      const abd = n(input.abdominalMm);
      const thigh = n(input.thighSkinfoldMm);
      if (!chest || !abd || !thigh) return null;
      const s = chest + abd + thigh;
      return r5(1.10938 - 0.0008267 * s + 0.0000016 * s * s - 0.0002574 * age);
    }
    const tri = n(input.tricepsMm);
    const supra = n(input.suprailiacMm);
    const thigh = n(input.thighSkinfoldMm);
    if (!tri || !supra || !thigh) return null;
    const s = tri + supra + thigh;
    return r5(1.0994921 - 0.0009929 * s + 0.0000023 * s * s - 0.0001392 * age);
  }

  if (input.formula === "jackson_pollock_7") {
    if (!age) return null;
    const chest = n(input.chestSkinfoldMm);
    const mid = n(input.midaxillaryMm);
    const tri = n(input.tricepsMm);
    const sub = n(input.subscapularMm);
    const abd = n(input.abdominalMm);
    const supra = n(input.suprailiacMm);
    const thigh = n(input.thighSkinfoldMm);
    if (!chest || !mid || !tri || !sub || !abd || !supra || !thigh) return null;
    const s = chest + mid + tri + sub + abd + supra + thigh;
    if (sex === "male") return r5(1.112 - 0.00043499 * s + 0.00000055 * s * s - 0.00028826 * age);
    return r5(1.097 - 0.00046971 * s + 0.00000056 * s * s - 0.00012828 * age);
  }

  if (input.formula === "durnin_womersley") {
    if (!age) return null;
    const tri = n(input.tricepsMm);
    const bi = n(input.bicepsMm);
    const sub = n(input.subscapularMm);
    const supra = n(input.suprailiacMm);
    if (!tri || !bi || !sub || !supra) return null;
    const sum = tri + bi + sub + supra;
    if (sum <= 0) return null;
    const log = Math.log10(sum);
    const band = ageBand(age);
    const coefs =
      sex === "male"
        ? {
            "17-19": [1.162, 0.063],
            "20-29": [1.1631, 0.0632],
            "30-39": [1.1422, 0.0544],
            "40-49": [1.162, 0.0700],
            "50+": [1.1715, 0.0779],
          }
        : {
            "17-19": [1.1549, 0.0678],
            "20-29": [1.1599, 0.0717],
            "30-39": [1.1423, 0.0632],
            "40-49": [1.1333, 0.0612],
            "50+": [1.1339, 0.0645],
          };
    const [a, b] = coefs[band];
    return r5(a - b * log);
  }

  if (input.formula === "slaughter") {
    const tri = n(input.tricepsMm);
    const sub = n(input.subscapularMm);
    if (!tri || !sub) return null;
    const s = tri + sub;
    if (sex === "male") return r5(1.0879 - 0.0015 * s);
    return r5(1.0764 - 0.0008 * s);
  }

  // Petroski (abordagem clínica simplificada para adultos).
  if (!age) return null;
  const tri = n(input.tricepsMm);
  const sub = n(input.subscapularMm);
  const supra = n(input.suprailiacMm);
  const calf = n(input.calfSkinfoldMm);
  if (!tri || !sub || !supra || !calf) return null;
  const s4 = tri + sub + supra + calf;
  return r5(1.10726863 - 0.00081201 * s4 + 0.00000212 * s4 * s4 - 0.00041761 * age);
}

function bodyFatFromDensity(density: number | null): number | null {
  if (!density || density <= 0) return null;
  return r2(495 / density - 450);
}

export function compositionByFormula(input: AssessmentInput): BodyCompositionResult {
  const required = requiredForFormula(input.formula);
  const missing: string[] = [];
  const density = densityByFormula(input);
  if (!density) {
    if (!input.sex || input.sex === "other" || input.sex === "unspecified") missing.push("sexo");
    if (!n(input.ageYears) && input.formula !== "slaughter") missing.push("idade");
    required.forEach((req) => {
      if (!missing.includes(req)) missing.push(req);
    });
  }
  const fatPct = bodyFatFromDensity(density);
  const weight = n(input.weightKg);
  const fatKg = fatPct != null && weight != null ? r2((weight * fatPct) / 100) : null;
  const leanKg = fatKg != null && weight != null ? r2(weight - fatKg) : null;
  return {
    formula: input.formula,
    required,
    missing: density ? [] : missing,
    bodyDensity: density,
    bodyFatPct: fatPct,
    fatMassKg: fatKg,
    leanMassKg: leanKg,
  };
}

export function computeAssessment(input: AssessmentInput): AssessmentComputed {
  return {
    basics: basicIndicators(input),
    composition: compositionByFormula(input),
  };
}

export function ageFromBirthDateAtDate(birthDate: string | null | undefined, isoDate: string): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const d = new Date(isoDate);
  if (Number.isNaN(b.getTime()) || Number.isNaN(d.getTime())) return null;
  let age = d.getFullYear() - b.getFullYear();
  const monthDiff = d.getMonth() - b.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && d.getDate() < b.getDate())) age -= 1;
  return age > 0 ? age : null;
}

export function activityLabel(a: NutritionActivityLevel | null | undefined): string {
  if (a === "sedentary") return "Sedentário";
  if (a === "light") return "Leve";
  if (a === "moderate") return "Moderado";
  if (a === "intense") return "Intenso";
  return "—";
}

export function goalLabel(g: NutritionGoal | null | undefined): string {
  if (g === "weight_loss") return "Emagrecimento";
  if (g === "muscle_gain") return "Ganho de massa";
  if (g === "maintenance") return "Manutenção";
  return "—";
}

