import React, { useEffect } from "react";
import { useAgent } from "./AgentContext";
import { useMCP } from "../contexts/MCPContext";

export const AgentRunner: React.FC = () => {
  const { plan, currentStep, setCurrentStep, updateStep } = useAgent();
  const { executeTool } = useMCP();

  useEffect(() => {
    if (currentStep >= plan.length) return;
    const step = plan[currentStep];
    if (step.status !== "pending") return;

    updateStep(currentStep, { status: "running" });

    executeTool(step.tool, step.params)
      .then(result => {
        updateStep(currentStep, { status: "success", result });
        setCurrentStep(currentStep + 1);
      })
      .catch(err => {
        updateStep(currentStep, { status: "error", error: err.message || String(err) });
      });
    // eslint-disable-next-line
  }, [currentStep, plan]);

  return null;
};
