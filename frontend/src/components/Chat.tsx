import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ApiClientRest } from '../rest/api_client_rest';
import { createChatApi, Message, Source } from '../rest/modules/chat';
import { updateChatLastMessage } from '../services/chatStorage';
import { useMCP } from '../contexts/MCPContext';

interface ContentItem {
  type: string;
  text: string;
}

interface ChatProps {
  chatId: string;
  client: ApiClientRest;
  onSendToAgent?: (message: string) => void; // <-- Add this
}

const Chat: React.FC<ChatProps> = ({ chatId, client, onSendToAgent }) => {
  const chatApi = useMemo(() => createChatApi(client), [client]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showSources, setShowSources] = useState(false);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, selectedTool, executeTool } = useMCP();

  useEffect(() => {
    console.log("chat id: " + chatId)
    if (!chatId) return;
    const loadChatHistory = async () => {
      try {
        const chatMessages = await chatApi.getChatMessages(chatId);
        const formattedMessages = chatMessages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            ...msg,
            role: msg.role === 'assistant' ? 'bot' as const : msg.role
          }));
        if (formattedMessages.length > 0) {
          setMessages(formattedMessages);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    loadChatHistory();
  }, [chatId, chatApi]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !chatId) return;
    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setMessages(prev => [
      ...prev,
      { role: 'bot', content: 'Thinking...', isLoading: true }
    ]);

    try {
      if (isConnected && selectedTool) {
        const messageHistory = messages
          .filter(msg => !msg.isLoading)
          .map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : msg.role,
            content: msg.content
          }));

        const response = await executeTool(selectedTool, {
          query: userMessage.content,
          chat_history: messageHistory
        });

        const contentText = Array.isArray(response.content)
          ? response.content.map((c: ContentItem) => c.text).join('\n')
          : typeof response.content === 'string'
            ? response.content
            : 'No response from tool';

        const botMessage: Message = {
          role: 'bot',
          content: contentText,
          sources: response.sources?.map((source: any, index: number) => ({
            id: `mcp-source-${index}`,
            title: source.title || 'Untitled Source',
            content: source.content,
            category: source.category || 'general',
            relevance_score: source.relevance_score ?? 0
          })) || []
        };

        setMessages(prev => prev.filter(msg => !msg.isLoading).concat([botMessage]));
      } else {
        const response = await chatApi.sendMessage(chatId, userMessage.content);
        const botMessage: Message = {
          ...response.response,
          role: 'bot'
        };
        setMessages(prev => prev.filter(msg => !msg.isLoading).concat([botMessage]));
      }
      updateChatLastMessage(chatId, userMessage.content);
    } catch (err) {
      setMessages(prev =>
        prev.filter(msg => !msg.isLoading).concat([
          { role: 'bot', content: `Error: Unable to fetch response. Please try again.` }
        ])
      );
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      sendMessage();
    }
  };

  const toggleSources = (index: number) => {
    if (selectedMessageIndex === index) {
      setShowSources(false);
      setSelectedMessageIndex(null);
    } else {
      setShowSources(true);
      setSelectedMessageIndex(index);
    }
  };

  const renderSources = (sources: Source[]) => (
    <div className="mt-2 text-sm p-2 bg-base-300 rounded-md">
      <h4 className="font-bold mb-1">Sources:</h4>
      {sources.map((source, idx) => (
        <div key={idx} className="mb-2 p-2 bg-base-200 rounded">
          <div className="font-semibold">{source.title}</div>
          <div className="text-xs opacity-70">{source.content.substring(0, 150)}...</div>
          <div className="text-xs mt-1 flex gap-2">
            <span className="badge badge-sm">{source.category}</span>
            <span className="badge badge-sm badge-primary">
              Score: {(source.relevance_score ?? 0).toFixed(2)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      {isConnected && selectedTool && (
        <div className="bg-base-100 border-b px-4 py-2 text-sm">
          Using MCP Agent: <span className="font-semibold">{selectedTool}</span>
        </div>
      )}

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded ${message.role === 'user'
                  ? 'bg-primary text-primary-content self-end'
                  : 'bg-base-200'
                  } ${message.isLoading ? 'opacity-70' : ''}`}
                style={{ maxWidth: '80%', alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                <div>
                  {message.isLoading ? (
                    <div className="flex items-center">
                      <span className="loading loading-dots loading-xs mr-2"></span>
                      {message.content}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>

                {/* Add Send to Agent button for user messages */}
                {message.role === 'user' && onSendToAgent && (
                  <button
                    className="text-xs mt-2 text-blue-500 hover:underline"
                    onClick={() => onSendToAgent(message.content)}
                  >
                    Send to Agent
                  </button>
                )}

                {message.sources && message.sources.length > 0 && (
                  <>
                    <button
                      onClick={() => toggleSources(index)}
                      className="text-xs mt-2 underline"
                    >
                      {selectedMessageIndex === index && showSources ? 'Hide sources' : 'Show sources'}
                    </button>

                    {selectedMessageIndex === index && showSources && renderSources(message.sources)}
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="p-4 bg-base-300">
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <div className="input-group flex">
              <input
                type="text"
                className="input flex-grow"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ?
                  <span className="loading loading-spinner"></span> :
                  'Send'
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
