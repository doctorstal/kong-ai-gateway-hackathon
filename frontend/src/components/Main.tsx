// src/components/Main.tsx
import React from "react";
import { Route, Routes, Link } from "react-router-dom";
import ChatView from "./ChatView";
import CombinedView from "./CombinedView";
import { MCPProvider } from "../contexts/MCPContext";

// MCP endpoint - configure based on your backend
const MCP_ENDPOINT = "ws://localhost:8080/mcp";

const Main: React.FC = () => {
  return (
    <MCPProvider mcpEndpoint={MCP_ENDPOINT}>
      <main className="min-h-screen flex flex-col">
        <header className="bg-primary text-primary-content p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <Link to="/" className="cursor-pointer">
                <h1 className="text-2xl font-bold">AI Assistant</h1>
              </Link>
            </div>
            <div className="flex gap-2">
              <Link to="/chat" className="btn btn-sm">Chat Only</Link>
              <Link to="/combined" className="btn btn-sm btn-accent">Chat + Agent</Link>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <Routes>
            <Route path="/chat" element={<ChatView />} />
            <Route path="/chat/:chatId" element={<ChatView />} />
            <Route path="/combined" element={<CombinedView />} />
            <Route path="/" element={<CombinedView />} />
          </Routes>
        </div>
      </main>
    </MCPProvider>
  );
};

export default Main;
