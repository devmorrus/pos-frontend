import { useContext } from "react";
import { CapabilityContext } from "../context/CapabilityContext";

export function useCapabilities() {
  const value = useContext(CapabilityContext);
  if (!value) throw new Error("useCapabilities must be used within CapabilityProvider");
  return value;
}
