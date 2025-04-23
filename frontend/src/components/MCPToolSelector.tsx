// src/components/MCPToolSelector.tsx
import React from 'react';
import { useMCP } from '../contexts/MCPContext';
import { MCPToolDefinition } from '../mcp/client';

interface MCPToolSelectorProps {
  className?: string;
}

const MCPToolSelector: React.FC<MCPToolSelectorProps> = ({ className }) => {
  const { tools, selectedTool, setSelectedTool, isConnected } = useMCP();

  if (!isConnected) {
    return (
      <div className={`${className} p-3 bg-base-200 rounded`}>
        <p className="text-sm text-warning">Connecting to MCP server...</p>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className={`${className} p-3 bg-base-200 rounded`}>
        <p className="text-sm text-error">No MCP tools available</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <h3 className="text-sm font-medium mb-2">Select AI Agent:</h3>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool: MCPToolDefinition) => (
          <button
            key={tool.name}
            onClick={() => setSelectedTool(tool.name)}
            className={`btn btn-sm ${selectedTool === tool.name ? 'btn-primary' : 'btn-outline'}`}
          >
            {tool.name.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MCPToolSelector;
