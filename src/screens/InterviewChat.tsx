import React, { useCallback, useEffect, useState } from "react";
import { DialogWrapper } from "@/components/DialogWrapper";
import {
  DailyAudio,
  useDaily,
  useLocalSessionId,
  useParticipantIds,
  useVideoTrack,
  useAudioTrack,
} from "@daily-co/daily-react";
import Video from "@/components/Video";
import { conversationAtom } from "@/store/conversation";
import { useAtom, useAtomValue } from "jotai";
import { screenAtom } from "@/store/screens";
import { Button } from "@/components/ui/button";
import { endConversation } from "@/api/endConversation";
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  PhoneIcon,
  Send,
  Download,
} from "lucide-react";
import {
  clearSessionTime,
  getSessionTime,
  setSessionStartTime,
  updateSessionEndTime,
} from "@/utils";
import { Timer } from "@/components/Timer";
import { TIME_LIMIT } from "@/config";
import { apiTokenAtom } from "@/store/tokens";
import { quantum } from 'ldrs';
import { cn } from "@/lib/utils";

quantum.register();

interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: string;
  category?: string;
}

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'ai',
    content: "Hello Aditya Khaire! Nice to meet you I'm David. I've reviewed your background and I'll be asking you questions about your experience and skills. Let's start with a brief introduction. Could you tell me about your professional journey and what motivates you in your career?",
    timestamp: '9:33:20 PM',
    category: 'Introduction'
  },
  {
    id: '2',
    type: 'user',
    content: "hello my anem is aditya i am from jejuri i have completed my diploma in computer engineering and persuing degree in BTech from VIT.",
    timestamp: '9:55:02 PM'
  },
  {
    id: '3',
    type: 'ai',
    content: "Thanks for that introduction, Aditya. I see you've listed several skills, including backend development, web development, MERN stack, and data analysis. Could you elaborate on your experience with these technologies? Perhaps pick one or two that you're most passionate about and tell me about a project where you utilized them. What were your contributions and what challenges did you overcome?",
    timestamp: '9:55:22 PM',
    category: 'Introduction'
  }
];

export const InterviewChat: React.FC = () => {
  const [conversation, setConversation] = useAtom(conversationAtom);
  const [, setScreenState] = useAtom(screenAtom);
  const token = useAtomValue(apiTokenAtom);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [inputMessage, setInputMessage] = useState("");

  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const localVideo = useVideoTrack(localSessionId);
  const localAudio = useAudioTrack(localSessionId);
  const isCameraEnabled = !localVideo.isOff;
  const isMicEnabled = !localAudio.isOff;
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (remoteParticipantIds.length && !start) {
      setStart(true);
      setTimeout(() => daily?.setLocalAudio(true), 4000);
    }
  }, [remoteParticipantIds, start]);

  useEffect(() => {
    if (!remoteParticipantIds.length || !start) return;

    setSessionStartTime();
    const interval = setInterval(() => {
      const time = getSessionTime();
      if (time >= TIME_LIMIT) {
        leaveConversation();
        clearInterval(interval);
      } else {
        updateSessionEndTime();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [remoteParticipantIds, start]);

  useEffect(() => {
    if (conversation?.conversation_url) {
      daily
        ?.join({
          url: conversation.conversation_url,
          startVideoOff: false,
          startAudioOff: true,
        })
        .then(() => {
          daily?.setLocalVideo(true);
          daily?.setLocalAudio(false);
        });
    }
  }, [conversation?.conversation_url]);

  const toggleVideo = useCallback(() => {
    daily?.setLocalVideo(!isCameraEnabled);
  }, [daily, isCameraEnabled]);

  const toggleAudio = useCallback(() => {
    daily?.setLocalAudio(!isMicEnabled);
  }, [daily, isMicEnabled]);

  const leaveConversation = useCallback(() => {
    daily?.leave();
    daily?.destroy();
    if (conversation?.conversation_id && token) {
      endConversation(token, conversation.conversation_id);
    }
    setConversation(null);
    clearSessionTime();
    setScreenState({ currentScreen: "finalScreen" });
  }, [daily, token]);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: inputMessage,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, newMessage]);
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left side - Video section */}
      <div className="flex-1 bg-black relative">
        {/* Video containers */}
        <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4">
          {/* User video */}
          <div className="bg-black rounded-lg overflow-hidden relative">
            <div className="absolute bottom-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              You
            </div>
            {localSessionId && (
              <Video
                id={localSessionId}
                className="w-full h-full"
                tileClassName="!object-cover"
              />
            )}
          </div>

          {/* AI Interviewer video */}
          <div className="bg-gray-800 rounded-lg overflow-hidden relative">
            <div className="absolute bottom-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              AI Interviewer
            </div>
            <div className="absolute top-4 right-4 z-10 bg-black/50 text-white px-2 py-1 rounded text-xs">
              HeyGen
            </div>
            {remoteParticipantIds?.length > 0 ? (
              <Video
                id={remoteParticipantIds[0]}
                className="w-full h-full"
                tileClassName="!object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <l-quantum
                  size="45"
                  speed="1.75"
                  color="white"
                ></l-quantum>
              </div>
            )}
          </div>
        </div>

        {/* Response Guidelines */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg p-4 max-w-md">
          <h3 className="font-semibold mb-3">Response Guidelines</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <div>
                <div className="font-medium text-green-700">Strong Response</div>
                <div className="text-gray-600 text-xs">
                  I'm most passionate about MERN stack development. In my recent project building an e-commerce platform, I was responsible for designing and implementing the backend API using Node.js and Express.js, integrating with MongoDB for data persistence, and developing the frontend using React. A key challenge was optimizing database queries for performance, which I addressed by implementing caching and query optimization techniques. This resulted in a 30% improvement in response times.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
              <div>
                <div className="font-medium text-blue-700">Acceptable Response</div>
                <div className="text-gray-600 text-xs">
                  I've worked with both backend and frontend technologies. I used Node.js and React in a college project. We built a basic web application, and I learned a lot about how these technologies work together.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
              </div>
              <div>
                <div className="font-medium text-red-700">Avoid in Response</div>
                <div className="text-gray-600 text-xs">
                  I've listed those skills because they are in demand. I haven't actually built any real projects with them yet, but I'm eager to learn.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control buttons */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            size="icon"
            className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 border-0"
            onClick={toggleAudio}
          >
            {!isMicEnabled ? (
              <MicOffIcon className="size-5 text-white" />
            ) : (
              <MicIcon className="size-5 text-white" />
            )}
          </Button>
          <Button
            size="icon"
            className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 border-0"
            onClick={toggleVideo}
          >
            {!isCameraEnabled ? (
              <VideoOffIcon className="size-5 text-white" />
            ) : (
              <VideoIcon className="size-5 text-white" />
            )}
          </Button>
          <Button
            size="icon"
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 border-0"
            onClick={leaveConversation}
          >
            <PhoneIcon className="size-5 text-white rotate-[135deg]" />
          </Button>
        </div>

        <DailyAudio />
      </div>

      {/* Right side - Chat section */}
      <div className="w-96 bg-white border-l flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Interview Chat</h2>
              <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Introduction</span>
            </div>
            <Button variant="ghost" size="icon">
              <Download className="size-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.type === 'ai' && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    AI
                  </div>
                  <div className="flex-1">
                    {message.category && (
                      <div className="text-xs text-purple-600 font-medium mb-1">{message.category}</div>
                    )}
                    <div className="bg-gray-100 rounded-lg p-3 text-sm">
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{message.timestamp}</div>
                  </div>
                </div>
              )}
              
              {message.type === 'user' && (
                <div className="flex items-start gap-3 justify-end">
                  <div className="flex-1 text-right">
                    <div className="bg-blue-600 text-white rounded-lg p-3 text-sm inline-block max-w-xs">
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{message.timestamp}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type or speak your response..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <Button
              size="icon"
              className="w-10 h-10 bg-green-600 hover:bg-green-700 rounded-lg"
            >
              <MicIcon className="size-4 text-white" />
            </Button>
            <Button
              size="icon"
              onClick={handleSendMessage}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              <Send className="size-4 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};