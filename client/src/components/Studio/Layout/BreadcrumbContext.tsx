import { createContext, useContext, useState } from "react";

interface BreadcrumbContextType {
  override: string;
  setOverride: (value: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  override: "",
  setOverride: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverride] = useState("");
  return (
    <BreadcrumbContext.Provider value={{ override, setOverride }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export const useBreadcrumb = () => useContext(BreadcrumbContext);
