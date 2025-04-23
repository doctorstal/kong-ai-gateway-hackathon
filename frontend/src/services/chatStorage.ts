// src/services/chatStorage.ts
export interface StoredChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  createdAt: number;
  mcpTool?: string; // Add MCP tool info
}

export function getStoredChats(): StoredChatSession[] {
  const chatsJson = localStorage.getItem('chats');
  return chatsJson ? JSON.parse(chatsJson) : [];
}

export function addChatFromApi(chat: any, firstMessage: string, mcpTool?: string): void {
  const storedChats = getStoredChats();
  
  const chatToStore: StoredChatSession = {
    id: chat.id,
    title: firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : ''),
    lastMessage: firstMessage,
    createdAt: Date.now(),
    mcpTool // Store the MCP tool if provided
  };
  
  storedChats.push(chatToStore);
  localStorage.setItem('chats', JSON.stringify(storedChats));
  
  // Trigger storage event for other components
  window.dispatchEvent(new Event('storage'));
}

export function updateChatLastMessage(chatId: string, message: string): void {
  const storedChats = getStoredChats();
  const chatIndex = storedChats.findIndex(c => c.id === chatId);
  
  if (chatIndex !== -1) {
    storedChats[chatIndex].lastMessage = message;
    localStorage.setItem('chats', JSON.stringify(storedChats));
    window.dispatchEvent(new Event('storage'));
  }
}

export function removeStoredChat(chatId: string): void {
  const storedChats = getStoredChats();
  const filteredChats = storedChats.filter(c => c.id !== chatId);
  localStorage.setItem('chats', JSON.stringify(filteredChats));
  window.dispatchEvent(new Event('storage'));
}

export function setActiveChat(chatId: string | null): void {
  if (chatId) {
    localStorage.setItem('activeChat', chatId);
  } else {
    localStorage.removeItem('activeChat');
  }
}

export function getActiveChat(): string | null {
  return localStorage.getItem('activeChat');
}
