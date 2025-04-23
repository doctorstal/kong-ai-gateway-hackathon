// src/components/MCPToolPanel.tsx
import React, { useState } from 'react';
import { useMCP } from '../contexts/MCPContext';
import { MCPToolDefinition } from '../mcp/client';

interface MCPToolPanelProps {
  toolName?: string;
  className?: string;
  onResult?: (result: any) => void;
}

const MCPToolPanel: React.FC<MCPToolPanelProps> = ({ 
  toolName, 
  className,
  onResult 
}) => {
  const { tools, selectedTool, executeTool, executing } = useMCP();
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  
  // Use provided toolName or fallback to selectedTool from context
  const activeTool = toolName || selectedTool;
  
  // Find the tool definition
  const toolDef = tools.find((t: MCPToolDefinition) => t.name === activeTool);
  
  if (!toolDef) {
    return (
      <div className={`${className} p-4 bg-base-200 rounded-lg`}>
        <p className="text-error">Tool not found</p>
      </div>
    );
  }
  
  const handleInputChange = (param: string, value: any) => {
    setInputs(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  const handleExecute = async () => {
    try {
      const result = await executeTool(toolDef.name, inputs);
      setResult(result);
      if (onResult) {
        onResult(result);
      }
    } catch (error) {
      console.error(`Error executing tool ${toolDef.name}:`, error);
    }
  };
  
  // Type guard for schema
  const isSchemaWithType = (schema: unknown): schema is { type: string } => {
    return typeof schema === 'object' && schema !== null && 'type' in schema;
  };
  
  // Generate input fields based on tool parameters
  const renderInputFields = () => {
    if (!toolDef.parameters) return null;
    
    return Object.entries(toolDef.parameters).map(([param, schema]) => (
      <div key={param} className="form-control w-full mb-3">
        <label className="label">
          <span className="label-text">{param.replace(/_/g, ' ')}</span>
        </label>
        
        {isSchemaWithType(schema) && schema.type === 'string' ? (
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder={`Enter ${param.replace(/_/g, ' ')}`}
            value={inputs[param] || ''}
            onChange={(e) => handleInputChange(param, e.target.value)}
          />
        ) : isSchemaWithType(schema) && schema.type === 'number' ? (
          <input
            type="number"
            className="input input-bordered w-full"
            placeholder={`Enter ${param.replace(/_/g, ' ')}`}
            value={inputs[param] || ''}
            onChange={(e) => handleInputChange(param, parseFloat(e.target.value))}
          />
        ) : isSchemaWithType(schema) && schema.type === 'boolean' ? (
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">{param.replace(/_/g, ' ')}</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={!!inputs[param]}
                onChange={(e) => handleInputChange(param, e.target.checked)}
              />
            </label>
          </div>
        ) : null}
      </div>
    ));
  };
  
  // Render result if available
  const renderResult = () => {
    if (!result) return null;
    
    return (
      <div className="mt-4 p-3 bg-base-300 rounded-lg">
        <h4 className="font-bold mb-2">Result:</h4>
        {result.content && result.content.map((item: any, index: number) => (
          <div key={index} className="mb-2">
            {item.type === 'text' ? (
              <div className="whitespace-pre-wrap">{item.text}</div>
            ) : item.type === 'image' ? (
              <img src={item.url} alt="Result" className="my-2 max-w-full rounded" />
            ) : (
              <pre className="bg-base-200 p-2 rounded overflow-x-auto">
                {JSON.stringify(item, null, 2)}
              </pre>
            )}
          </div>
        ))}
        
        {result.sources && result.sources.length > 0 && (
          <div className="mt-4">
            <h5 className="font-semibold mb-1">Sources:</h5>
            {result.sources.map((source: any, index: number) => (
              <div key={index} className="text-sm p-2 bg-base-200 rounded mb-2">
                <div className="font-medium">{source.title}</div>
                <div className="text-xs opacity-70">{source.content}</div>
                {source.category && (
                  <span className="badge badge-sm">{source.category}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${className} p-4 bg-base-200 rounded-lg`}>
      <h3 className="text-lg font-medium mb-4">{toolDef.name.replace(/_/g, ' ')}</h3>
      
      {toolDef.description && (
        <p className="text-sm mb-4 opacity-70">{toolDef.description}</p>
      )}
      
      <div className="mb-4">
        {renderInputFields()}
      </div>
      
      <button
        className="btn btn-primary"
        onClick={handleExecute}
        disabled={executing}
      >
        {executing ? (
          <>
            <span className="loading loading-spinner loading-xs mr-2"></span>
            Executing...
          </>
        ) : 'Execute Tool'}
      </button>
      
      {renderResult()}
    </div>
  );
};

export default MCPToolPanel;
