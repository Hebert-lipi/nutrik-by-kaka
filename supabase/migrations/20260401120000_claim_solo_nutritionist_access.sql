-- Este timestamp já existia no histórico de migrations com lógica obsoleta (clinica-principal).
-- A implementação atual de claim_solo_nutritionist_access (clínica pessoal, idempotente)
-- está em 20260402120000_professional_onboarding_solo_clinic.sql.
-- No-op: evita reintroduzir slug fixo e mantém alinhamento com bases que já registaram esta migration.

SELECT 1;
