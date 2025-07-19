import React, { useCallback, useEffect, useState } from "react";
import { DialogWrapper } from "@/components/DialogWrapper";
import {
  DailyAudio,
  useDaily,
  useLocalSessionId,
  useParticipantIds,
  useVideoTrack,
  useAudioTrack,
  useDailyEvent,
} from "@daily-co/daily-react";
import Video from "@/components/Video";
import { conversationAtom } from "@/store/conversation";
import { useAtom, useAtomValue } from "jotai";
import { screenAtom } from "@/store/screens";
import { Button } from "@/components/ui/button";
import { endConversation } from "@/api/endConversation";
import { createConversation } from "@/api/createConversation";
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  PhoneIcon,
  Send,
  Download,
  AlertCircle,
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

interface GuidelineExample {
  type: 'strong' | 'acceptable' | 'avoid';
  title: string;
  content: string;
}

export const InterviewChat: React.FC = () => {
  const [conversation, setConversation] = useAtom(conversationAtom);
  const [, setScreenState] = useAtom(screenAtom);
  const token = useAtomValue(apiTokenAtom);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [conversationPhase, setConversationPhase] = useState<'intro' | 'technical' | 'experience' | 'closing'>('intro');
  
  // Dynamic guidelines based on conversation phase
  const [guidelines, setGuidelines] = useState<GuidelineExample[]>([
    {
      type: 'strong',
      title: 'Ready to Begin',
      content: 'Welcome! Your interview with Sarah Mitchell is about to start. She will introduce herself and begin with some general questions about your background.'
    },
    {
      type: 'acceptable',
      title: 'Interview Process',
      content: 'This interview will cover your experience, technical skills, and career goals. Feel free to provide detailed examples and ask questions.'
    },
    {
      type: 'avoid',
      title: 'Getting Connected',
      content: 'Please ensure your camera and microphone are enabled. The AI interviewer will join shortly to begin the conversation.'
    }
  ]);

  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const localVideo = useVideoTrack(localSessionId);
  const localAudio = useAudioTrack(localSessionId);
  const isCameraEnabled = !localVideo.isOff;
  const isMicEnabled = !localAudio.isOff;
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });
  const [start, setStart] = useState(false);

  // Update guidelines based on conversation context
  const updateGuidelinesBasedOnPhase = (phase: string, lastMessage?: string) => {
    switch (phase) {
      case 'intro':
        setGuidelines([
          {
            type: 'strong',
            title: 'Strong Introduction',
            content: 'Hi Sarah! I\'m excited about this opportunity. I have 3 years of experience in full-stack development, specializing in React and Node.js. I\'ve led several successful projects including an e-commerce platform that increased sales by 40%.'
          },
          {
            type: 'acceptable',
            title: 'Good Introduction',
            content: 'Hello! I\'m a software developer with experience in web development. I\'ve worked on various projects using modern technologies.'
          },
          {
            type: 'avoid',
            title: 'Avoid Generic Responses',
            content: 'Hi. I\'m looking for a job and I think I can do this role. I don\'t have much experience but I\'m willing to learn.'
          }
        ]);
        break;
      case 'technical':
        setGuidelines([
          {
            type: 'strong',
            title: 'Technical Excellence',
            content: 'I implemented a microservices architecture using Docker and Kubernetes, which improved system scalability by 60%. I used Redis for caching and implemented CI/CD pipelines with Jenkins.'
          },
          {
            type: 'acceptable',
            title: 'Technical Competence',
            content: 'I\'ve worked with React, Node.js, and MongoDB. I understand the basics of system design and have experience with APIs.'
          },
          {
            type: 'avoid',
            title: 'Avoid Vague Answers',
            content: 'I know some programming languages. I\'ve used frameworks before but can\'t remember the details.'
          }
        ]);
        break;
      case 'experience':
        setGuidelines([
          {
            type: 'strong',
            title: 'Detailed Experience',
            content: 'In my previous role at TechCorp, I led a team of 4 developers to rebuild their legacy system. We reduced load times by 70% and improved user satisfaction scores from 3.2 to 4.8.'
          },
          {
            type: 'acceptable',
            title: 'Relevant Experience',
            content: 'I worked on several projects where I collaborated with cross-functional teams and delivered features on time.'
          },
          {
            type: 'avoid',
            title: 'Avoid Minimal Details',
            content: 'I did some projects. They went okay. I worked with other people sometimes.'
          }
        ]);
        break;
      default:
        break;
    }
  };

  // Initialize conversation with better error handling
  useEffect(() => {
    const initializeConversation = async () => {
      if (!conversation && token) {
        try {
          console.log("Initializing conversation with token:", token?.substring(0, 8) + "...");
          
          // Validate token format
          if (!token || token.length < 20) {
            throw new Error("Invalid API token format");
          }

          const newConversation = await createConversation(token);
          console.log("Conversation created successfully:", newConversation.conversation_id);
          setConversation(newConversation);
          setConnectionError(null);
        } catch (error: any) {
          console.error("Failed to create conversation:", error);
          
          if (error.message === "CREDITS_EXHAUSTED") {
            setConnectionError("Your account is out of conversational credits. Please top up your Tavus account at https://platform.tavus.io/ to continue.");
          } else {
            const errorMessage = error.message || "Unknown error occurred";
            setConnectionError(`Connection failed: ${errorMessage}`);
          }
        } finally {
          setIsInitializing(false);
        }
      }
    };

    if (token && !conversation) {
      initializeConversation();
    }
  }, [conversation, token, setConversation]);

  // Listen for AI messages and update guidelines dynamically
  useDailyEvent(
    "app-message",
    useCallback((ev: any) => {
      console.log("Received app message:", ev.data);
      
      if (ev.data?.event_type === "conversation.speech") {
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: ev.data.properties?.text || "",
          timestamp: new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          }),
          category: 'Interview'
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Determine conversation phase and update guidelines
        const messageContent = aiMessage.content.toLowerCase();
        if (messageContent.includes('technical') || messageContent.includes('programming') || messageContent.includes('code')) {
          setConversationPhase('technical');
          updateGuidelinesBasedOnPhase('technical', aiMessage.content);
        } else if (messageContent.includes('experience') || messageContent.includes('project') || messageContent.includes('work')) {
          setConversationPhase('experience');
          updateGuidelinesBasedOnPhase('experience', aiMessage.content);
        } else if (messages.length === 0) {
          setConversationPhase('intro');
          updateGuidelinesBasedOnPhase('intro', aiMessage.content);
        }
      }
    }, [messages.length])
  );

  // Handle participant joining
  useEffect(() => {
    if (remoteParticipantIds.length && !start) {
      console.log("Remote participant joined, starting conversation");
      setStart(true);
      setTimeout(() => {
        daily?.setLocalAudio(true);
        console.log("Audio enabled");
      }, 2000);
    }
  }, [remoteParticipantIds, start, daily]);

  // Session time management
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

  // Join Daily call when conversation is ready
  useEffect(() => {
    if (conversation?.conversation_url && daily) {
      console.log("Joining Daily call:", conversation.conversation_url);
      daily
        .join({
          url: conversation.conversation_url,
          startVideoOff: false,
          startAudioOff: true,
        })
        .then(() => {
          console.log("Successfully joined Daily call");
          daily.setLocalVideo(true);
          daily.setLocalAudio(false);
        })
        .catch((error) => {
          console.error("Failed to join Daily call:", error);
          setConnectionError("Failed to join video call");
        });
    }
  }, [conversation?.conversation_url, daily]);

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
  }, [daily, token, conversation, setConversation, setScreenState]);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: inputMessage,
        timestamp: new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Send message to AI via Daily
      if (daily && conversation?.conversation_id) {
        daily.sendAppMessage({
          message_type: "conversation",
          event_type: "conversation.echo",
          conversation_id: conversation.conversation_id,
          properties: {
            modality: "text",
            text: inputMessage,
          },
        });
      }
      
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const retryConnection = () => {
    setConnectionError(null);
    setIsInitializing(true);
    setConversation(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left side - Video section */}
      <div className="flex-1 bg-black relative">
        {/* Video containers */}
        <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4">
          {/* User video */}
          <div className="bg-black rounded-lg overflow-hidden relative">
            <div className="absolute bottom-4 left-4 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
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
          <div className="bg-gray-900 rounded-lg overflow-hidden relative">
            <div className="absolute bottom-4 left-4 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Sarah Mitchell
            </div>
            {connectionError ? (
              <div className="flex h-full items-center justify-center flex-col gap-4 text-white">
                <AlertCircle className="size-12 text-red-500" />
                <div className="text-center px-4">
                  <p className="text-lg font-semibold mb-2">Connection Error</p>
                  <p className="text-sm text-gray-300 mb-4">{connectionError}</p>
                  <Button 
                    onClick={retryConnection}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Retry Connection
                  </Button>
                </div>
              </div>
            ) : remoteParticipantIds?.length > 0 ? (
              <Video
                id={remoteParticipantIds[0]}
                className="w-full h-full"
                tileClassName="!object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center flex-col gap-4">
                <l-quantum
                  size="45"
                  speed="1.75"
                  color="white"
                ></l-quantum>
                <p className="text-white text-sm">
                  {isInitializing ? "Initializing interview..." : "Connecting to Sarah Mitchell..."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Response Guidelines */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg p-4 max-w-md shadow-lg">
          <h3 className="font-semibold mb-3 text-gray-800">Response Guidelines</h3>
          
          <div className="space-y-3 text-sm">
            {guidelines.map((guideline, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                  guideline.type === 'strong' ? "bg-green-100" : 
                  guideline.type === 'acceptable' ? "bg-blue-100" : "bg-red-100"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    guideline.type === 'strong' ? "bg-green-500" : 
                    guideline.type === 'acceptable' ? "bg-blue-500" : "bg-red-500"
                  )}></div>
                </div>
                <div>
                  <div className={cn(
                    "font-medium",
                    guideline.type === 'strong' ? "text-green-700" : 
                    guideline.type === 'acceptable' ? "text-blue-700" : "text-red-700"
                  )}>
                    {guideline.title}
                  </div>
                  <div className="text-gray-600 text-xs">
                    {guideline.content}
                  </div>
                </div>
              </div>
            ))}
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
              <h2 className="text-lg font-semibold text-gray-800">Interview Chat</h2>
              <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full capitalize">
                {conversationPhase}
              </span>
            </div>
            <Button variant="ghost" size="icon">
              <Download className="size-4 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-lg mb-2">👋</div>
                <p className="text-gray-700 font-medium">Ready to start your interview?</p>
                <p className="text-sm text-gray-500">Sarah Mitchell will begin the conversation shortly</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {message.type === 'ai' && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      SM
                    </div>
                    <div className="flex-1">
                      {message.category && (
                        <div className="text-xs text-purple-600 font-medium mb-1">{message.category}</div>
                      )}
                      <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-800">
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
            ))
          )}
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800 bg-white placeholder-gray-500"
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