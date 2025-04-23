import React, { createContext, useContext, useState } from "react";
import { MCPExecutionResult } from "../mcp/client";

export type AgentStep = {
  id: string;
  description: string;
  tool: string;
  params: Record<string, any>;
  status: "pending" | "running" | "success" | "error";
  result?: MCPExecutionResult;
  error?: string;
};

type AgentContextType = {
  goal: string;
  setGoal: (goal: string) => void;
  plan: AgentStep[];
  setPlan: (plan: AgentStep[]) => void;
  currentStep: number;
  setCurrentStep: (i: number) => void;
  updateStep: (i: number, patch: Partial<AgentStep>) => void;
};

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goal, setGoal] = useState("");
  const [plan, setPlan] = useState<AgentStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const updateStep = (i: number, patch: Partial<AgentStep>) => {
    setPlan(prev => prev.map((step, idx) => idx === i ? { ...step, ...patch } : step));
  };

  return (
    <AgentContext.Provider value={{ goal, setGoal, plan, setPlan, currentStep, setCurrentStep, updateStep }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within AgentProvider");
  return ctx;
};
