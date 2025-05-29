
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  type: 'user' | 'assistant';
  timestamp: number;
  hasImage?: boolean;
  hasFiles?: boolean;
}

interface ChatDisplayProps {
  messages: Message[];
}

const ChatDisplay: React.FC<ChatDisplayProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-cyan-600 text-white ml-4'
                  : 'bg-gray-700 text-gray-100 mr-4'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.type === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                    AI
                  </div>
                )}
                
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs opacity-70 flex-wrap">
                    <span>{formatTime(message.timestamp)}</span>
                    {message.hasImage && (
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                        📷 Vision used
                      </span>
                    )}
                    {message.hasFiles && (
                      <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded">
                        📎 Files attached
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatDisplay;
