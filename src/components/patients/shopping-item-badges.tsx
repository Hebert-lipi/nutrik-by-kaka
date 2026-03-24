"use client";

import * as React from "react";

type ShoppingItemBadgesProps = {
  quantityLabel: string;
  missingQuantity: boolean;
  unitConflict: boolean;
};

function normalizeQtyLabel(value: string): string {
  const v = value.trim();
  if (!v) return "Quantidade orientada pela nutricionista";
  return v[0].toUpperCase() + v.slice(1);
}

export function ShoppingItemBadges({ quantityLabel, missingQuantity, unitConflict }: ShoppingItemBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-text-secondary">
        {normalizeQtyLabel(quantityLabel)}
      </span>
      {missingQuantity ? (
        <span className="rounded-full bg-yellow/20 px-2 py-0.5 font-semibold text-text-secondary">Sem quantidade definida</span>
      ) : null}
      {unitConflict ? (
        <span className="rounded-full bg-orange/20 px-2 py-0.5 font-semibold text-text-secondary">Unidade inconsistente</span>
      ) : null}
    </div>
  );
}
