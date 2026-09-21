import { useId } from "react";

/**
 * Stable control id for label association.
 * Prefers an explicit id; otherwise uses React's useId so every field
 * gets a unique htmlFor/id pair without callers having to pass one.
 */
export function useFieldId(explicitId?: string) {
  const generatedId = useId();
  return explicitId || generatedId;
}
