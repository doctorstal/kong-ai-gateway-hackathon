// src/agent/AgentView.tsx
import React from "react";
import { AgentProvider } from "./AgentContext";
import { GoalInput } from "./GoalInput";
import { AgentPlan } from "./AgentPlan";
import { AgentRunner } from "./AgentRunner";

const AgentView: React.FC = () => {
  return (
    <AgentProvider>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-base-100 border-b px-4 py-2">
          <h2 className="text-xl font-semibold">AI Agent</h2>
          <p className="text-sm opacity-70">Set a goal and let the AI handle it</p>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <GoalInput />
          <AgentPlan />
          <AgentRunner />
        </div>
      </div>
    </AgentProvider>
  );
};

export default AgentView;
