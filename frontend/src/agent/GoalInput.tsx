// src/agent/GoalInput.tsx
import React, { useState, useEffect } from "react";
import { useAgent, AgentStep } from "./AgentContext";

interface GoalInputProps {
  initialGoal?: string;
}

export const GoalInput: React.FC<GoalInputProps> = ({ initialGoal }) => {
  const { setGoal, setPlan } = useAgent();
  const [input, setInput] = useState(initialGoal || "");

  // Simple demo planner
  const planGoal = (goal: string): AgentStep[] => [
    { id: "1", description: "Analyze goal", tool: "analyze_goal", params: { goal }, status: "pending" },
    { id: "2", description: "Execute main tool", tool: "main_tool", params: { goal }, status: "pending" }
  ];

  useEffect(() => {
    if (initialGoal && initialGoal.trim()) {
      setInput(initialGoal);
      setGoal(initialGoal);
      setPlan(planGoal(initialGoal));
    }
    // eslint-disable-next-line
  }, [initialGoal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGoal(input);
    setPlan(planGoal(input));
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <input
        className="input input-bordered flex-1"
        placeholder="What do you want the agent to do?"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button className="btn btn-primary" type="submit">Set Goal</button>
    </form>
  );
};
