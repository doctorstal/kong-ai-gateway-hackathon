import React from "react";
import { useAgent } from "./AgentContext";

export const AgentPlan: React.FC = () => {
  const { plan, currentStep } = useAgent();

  return (
    <div className="mb-4">
      <h3 className="font-bold mb-2">Plan</h3>
      <ol className="list-decimal ml-6">
        {plan.map((step, i) => (
          <li key={step.id} className={i === currentStep ? "font-bold" : ""}>
            <span className="mr-2">
              {step.status === "pending" && "⏳"}
              {step.status === "running" && "🏃"}
              {step.status === "success" && "✅"}
              {step.status === "error" && "❌"}
            </span>
            {step.description}
            {step.result && (
              <div className="text-xs text-green-700 whitespace-pre-wrap">
                {JSON.stringify(step.result, null, 2)}
              </div>
            )}
            {step.error && (
              <div className="text-xs text-red-500">{step.error}</div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};
