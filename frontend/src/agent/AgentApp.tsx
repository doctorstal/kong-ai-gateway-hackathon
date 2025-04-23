// src/agent/AgentApp.tsx
import React from "react";
import { AgentProvider } from "./AgentContext";
import { GoalInput } from "./GoalInput";
import { AgentPlan } from "./AgentPlan";
import { AgentRunner } from "./AgentRunner";

interface AgentAppProps {
  initialGoal?: string;
}

export const AgentApp: React.FC<AgentAppProps> = ({ initialGoal }) => (
  <AgentProvider>
    <div className="max-w-2xl mx-auto p-4">
      <GoalInput initialGoal={initialGoal} />
      <AgentPlan />
      <AgentRunner />
    </div>
  </AgentProvider>
);
