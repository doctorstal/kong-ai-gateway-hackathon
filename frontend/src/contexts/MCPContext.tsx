// src/contexts/MCPContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MCPClient, MCPToolDefinition, MCPExecutionResult } from '../mcp/client';

interface MCPContextType {
  client: MCPClient | null;
  tools: MCPToolDefinition[];
  isConnected: boolean;
  selectedTool: string | null;
  setSelectedTool: (toolName: string) => void;
  executing: boolean;
  executeTool: (toolName: string, params: Record<string, any>) => Promise<MCPExecutionResult>;
  error: string | null;
}

const MCPContext = createContext<MCPContextType>({
  client: null,
  tools: [],
  isConnected: false,
  selectedTool: null,
  setSelectedTool: () => {},
  executing: false,
  executeTool: async () => ({ content: [] }),
  error: null
});

export const MCPProvider: React.FC<{ 
  children: React.ReactNode;
  mcpEndpoint: string;
}> = ({ children, mcpEndpoint }) => {
  const [client, setClient] = useState<MCPClient | null>(null);
  const [tools, setTools] = useState<MCPToolDefinition[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMCP = async () => {
      try {
        const newClient = new MCPClient(mcpEndpoint);
        
        await newClient.connect();
        setClient(newClient);
        setIsConnected(true);
        
        // Fetch available tools
        const availableTools = await newClient.listTools();
        setTools(availableTools);
        
        // Set default tool if available
        if (availableTools.length > 0) {
          setSelectedTool(availableTools[0].name);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Failed to connect to MCP server:', err);
        setError(`Failed to connect to MCP server: ${errorMessage}`);
      }
    };

    initializeMCP();

    // Cleanup function
    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, [mcpEndpoint]);

  const executeTool = async (toolName: string, params: Record<string, any>): Promise<MCPExecutionResult> => {
    if (!client || !isConnected) {
      throw new Error('MCP client not connected');
    }

    setExecuting(true);
    try {
      const result = await client.executeTool(toolName, params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to execute tool: ${errorMessage}`);
      throw err;
    } finally {
      setExecuting(false);
    }
  };

  return (
    <MCPContext.Provider value={{ 
      client, 
      tools, 
      isConnected, 
      selectedTool, 
      setSelectedTool,
      executing,
      executeTool,
      error 
    }}>
      {children}
    </MCPContext.Provider>
  );
};

export const useMCP = () => useContext(MCPContext);
