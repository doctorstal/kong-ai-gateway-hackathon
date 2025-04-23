// src/components/ChatView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiClientRest } from '../rest/api_client_rest';
import Chat from './Chat';
import WelcomeScreen from './WelcomeScreen';
import ChatSidebar from './ChatSidebar';
import { setActiveChat } from '../services/chatStorage';

interface ChatViewProps {
  onSendToAgent?: (message: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onSendToAgent }) => {
  const { chatId } = useParams<{ chatId: string }>();
  const [activeChatId, setActiveChatId] = useState<string | null>(chatId || null);
  const apiClient = useMemo(() => new ApiClientRest(), []);
  const navigate = useNavigate();

  useEffect(() => {
    if (chatId) {
      setActiveChatId(chatId);
      setActiveChat(chatId);
    } else {
      setActiveChatId(null);
    }
  }, [chatId]);

  const handleSelectChat = (selectedChatId: string) => {
    setActiveChatId(selectedChatId);
    navigate(`/chat/${selectedChatId}`);
  };

  const handleNewChat = () => {
    setActiveChat(null);
    setActiveChatId(null);
    navigate('/');
  };

  const handleChatCreated = (newChatId: string) => {
    setActiveChatId(newChatId);
    navigate(`/chat/${newChatId}`);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="relative flex h-full">
        <ChatSidebar
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeChatId ? (
          <Chat chatId={activeChatId} client={apiClient} onSendToAgent={onSendToAgent} />
        ) : (
          <WelcomeScreen onChatCreated={handleChatCreated} />
        )}
      </div>
    </div>
  );
};

export default ChatView;
