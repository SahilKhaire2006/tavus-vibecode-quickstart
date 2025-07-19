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
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [interviewerName] = useState("Sarah Mitchell");
  const [interviewerTitle] = useState("Senior Technical Interviewer");

  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const localVideo = useVideoTrack(localSessionId);
  const localAudio = useAudioTrack(localSessionId);
  const isCameraEnabled = !localVideo.isOff;
  const isMicEnabled = !localAudio.isOff;
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });
  const [start, setStart] = useState(false);

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
            setErrorType("credits_exhausted");
          } else {
            const errorMessage = error.message || "Unknown error occurred";
            setConnectionError(`Connection failed: ${errorMessage}`);
            setErrorType("connection_error");
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

  const retryConnection = () => {
    setConnectionError(null);
    setErrorType(null);
    setIsInitializing(true);
    setConversation(null);
  };

  const goToSettings = () => {
    setScreenState({ currentScreen: "settings" });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <VideoIcon className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Technical Interview</h1>
              <p className="text-sm text-gray-600">Professional Video Interview Session</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Live</span>
            </div>
            <Timer />
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="h-full relative">
            {connectionError ? (
              <div className="flex h-full items-center justify-center flex-col gap-6 bg-gray-50">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="size-8 text-red-600" />
                </div>
                <div className="text-center max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Issue</h3>
                  <p className="text-gray-600 mb-6">{connectionError}</p>
                  {errorType === "credits_exhausted" ? (
                    <Button 
                      onClick={goToSettings}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                      Manage Account
                    </Button>
                  ) : (
                    <Button 
                      onClick={retryConnection}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                      Retry Connection
                    </Button>
                  )}
                </div>
              </div>
            ) : remoteParticipantIds?.length > 0 ? (
              <>
                {/* Main interviewer video */}
                <Video
                  id={remoteParticipantIds[0]}
                  className="w-full h-full"
                  tileClassName="!object-cover"
                />
                
                {/* Interviewer info overlay */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">SM</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{interviewerName}</p>
                      <p className="text-xs text-gray-600">{interviewerTitle}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center flex-col gap-6 bg-gray-50">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <l-quantum
                    size="32"
                    speed="1.75"
                    color="#2563eb"
                  ></l-quantum>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isInitializing ? "Preparing Interview" : "Connecting to Interviewer"}
                  </h3>
                  <p className="text-gray-600">
                    {isInitializing ? "Setting up your interview session..." : `Connecting to ${interviewerName}...`}
                  </p>
                </div>
              </div>
            )}

            {/* User video (picture-in-picture) */}
            {localSessionId && (
              <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden shadow-lg border-2 border-white">
                <Video
                  id={localSessionId}
                  className="w-full h-full"
                  tileClassName="!object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  You
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleAudio}
            className={cn(
              "w-12 h-12 rounded-full border-2 transition-all duration-200",
              !isMicEnabled 
                ? "bg-red-500 hover:bg-red-600 border-red-500 text-white" 
                : "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700"
            )}
          >
            {!isMicEnabled ? (
              <MicOffIcon className="size-5" />
            ) : (
              <MicIcon className="size-5" />
            )}
          </Button>
          
          <Button
            onClick={toggleVideo}
            className={cn(
              "w-12 h-12 rounded-full border-2 transition-all duration-200",
              !isCameraEnabled 
                ? "bg-red-500 hover:bg-red-600 border-red-500 text-white" 
                : "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700"
            )}
          >
            {!isCameraEnabled ? (
              <VideoOffIcon className="size-5" />
            ) : (
              <VideoIcon className="size-5" />
            )}
          </Button>
          
          <Button
            onClick={leaveConversation}
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 border-2 border-red-500 text-white transition-all duration-200"
          >
            <PhoneIcon className="size-5 rotate-[135deg]" />
          </Button>
        </div>
        
        <div className="flex items-center justify-center mt-3 gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isMicEnabled ? "bg-green-500" : "bg-red-500")}></div>
            <span>{isMicEnabled ? "Microphone On" : "Microphone Off"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isCameraEnabled ? "bg-green-500" : "bg-red-500")}></div>
            <span>{isCameraEnabled ? "Camera On" : "Camera Off"}</span>
          </div>
        </div>
      </div>

      <DailyAudio />
    </div>
  );
};