import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ChatMessage, CoachContext, fetchCoachResponse } from '../utils/aiService';

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  
  // Actions
  sendMessage: (context: CoachContext, query: string) => Promise<void>;
  clearHistory: () => void;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'greeting',
  role: 'assistant',
  content: "Hi there! I'm your Smart Financial Coach. Before you ask, I've already reviewed your latest budget metrics silently. How can I help you save money today?",
  timestamp: Date.now(),
};

export const useChatStore = create<ChatState>()(
  devtools((set, get) => ({
    messages: [INITIAL_MESSAGE],
    isTyping: false,

    sendMessage: async (context: CoachContext, query: string) => {
      // 1. Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString() + '_user',
        role: 'user',
        content: query,
        timestamp: Date.now(),
      };
      
      set(state => ({
        messages: [...state.messages, userMessage],
        isTyping: true
      }));

      // 2. Fetch AI response silently injecting Context
      try {
        const responseContent = await fetchCoachResponse(context, query);
        
        const aiMessage: ChatMessage = {
          id: Date.now().toString() + '_ai',
          role: 'assistant',
          content: responseContent,
          timestamp: Date.now(),
        };

        set(state => ({
          messages: [...state.messages, aiMessage],
          isTyping: false
        }));
        
      } catch (e) {
        console.error("Chat engine failed", e);
        
        const errorMessage: ChatMessage = {
          id: Date.now().toString() + '_error',
          role: 'assistant',
          content: "Sorry, my servers are currently analyzing a lot of data and I failed to process that. Try again in a moment!",
          timestamp: Date.now(),
        };

        set(state => ({
          messages: [...state.messages, errorMessage],
          isTyping: false
        }));
      }
    },

    clearHistory: () => {
      set({ messages: [INITIAL_MESSAGE], isTyping: false });
    }
  }))
);
