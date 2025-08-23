import { EvolutionContext } from "@/contexts/EvolutionContext";
import { useContext } from "react";

export const useEvolution = () => {
  const context = useContext(EvolutionContext);
  if (!context) {
    throw new Error('useEvolution must be used within an EvolutionProvider');
  }
  return context;
};
