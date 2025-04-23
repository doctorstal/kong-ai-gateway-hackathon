// src/components/CombinedView.tsx
import React, { useState } from "react";
import ChatView from "./ChatView";
import { AgentApp } from "../agent/AgentApp";

const CombinedView: React.FC = () => {
  const [agentGoal, setAgentGoal] = useState("");

  // Handler to send chat message to agent
  const handleSendToAgent = (message: string) => {
    setAgentGoal(message);
  };

  return (
    <div className="flex flex-1 h-screen overflow-hidden">
      <div className="flex-1 border-r border-gray-200">
        <ChatView onSendToAgent={handleSendToAgent} />
      </div>
      <div className="flex-1">
        <AgentApp initialGoal={agentGoal} />
      </div>
    </div>
  );
};

export default CombinedView;
