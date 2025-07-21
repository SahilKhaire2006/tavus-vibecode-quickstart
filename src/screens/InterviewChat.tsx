import React, { useCallback, useEffect, useState } from "react";
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
import { useAtom } from "jotai";
import { screenAtom } from "@/store/screens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { TIME_LIMIT } from "@/config";
import { quantum } from 'ldrs';
import { cn } from "@/lib/utils";

quantum.register();

interface UserInfo {
  name: string;
  projectTitle: string;
  projectSummary: string;
  skills: string;
  certificates: string;
  education: string;
  experience: string;
}

export const InterviewChat: React.FC = () => {
  const [conversation, setConversation] = useAtom(conversationAtom);
  const [, setScreenState] = useAtom(screenAtom);
  const [showForm, setShowForm] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "",
    projectTitle: "",
    projectSummary: "",
    skills: "",
    certificates: "",
    education: "",
    experience: ""
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [interviewerName] = useState("Sarah Mitchell");
  const [interviewerTitle] = useState("Senior Technical Interviewer");
  const [currentTime, setCurrentTime] = useState(new Date());

  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const localVideo = useVideoTrack(localSessionId);
  const localAudio = useAudioTrack(localSessionId);
  const isCameraEnabled = !localVideo.isOff;
  const isMicEnabled = !localAudio.isOff;
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });
  const [start, setStart] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowForm(false);
    setIsInitializing(true);
  };

  // Initialize conversation with better error handling
  useEffect(() => {
    const initializeConversation = async () => {
      if (!conversation && !showForm) {
        try {
          console.log("Initializing conversation with user info:", userInfo);

          const newConversation = await createConversation(userInfo);
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

    if (!showForm && !conversation) {
      initializeConversation();
    }
  }, [conversation, showForm, userInfo, setConversation]);

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
    if (conversation?.conversation_id) {
      endConversation("90679945b9fa40b4943fb8c3b64ca59e", conversation.conversation_id);
    }
    setConversation(null);
    clearSessionTime();
    setScreenState({ currentScreen: "finalScreen" });
  }, [daily, conversation, setConversation, setScreenState]);

  const retryConnection = () => {
    setConnectionError(null);
    setErrorType(null);
    setIsInitializing(true);
    setConversation(null);
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-3xl border border-gray-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <VideoIcon className="size-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pre-Interview Information</h1>
            <p className="text-gray-600 text-lg">Please provide your details to personalize the interview experience</p>
          </div>
          
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name *</label>
                <Input
                  required
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                  placeholder="Enter your full name"
                  className="w-full h-12 text-gray-900 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Project Title *</label>
                <Input
                  required
                  value={userInfo.projectTitle}
                  onChange={(e) => setUserInfo({...userInfo, projectTitle: e.target.value})}
                  placeholder="Your main project title"
                  className="w-full h-12 text-gray-900 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Project Summary *</label>
              <textarea
                required
                value={userInfo.projectSummary}
                onChange={(e) => setUserInfo({...userInfo, projectSummary: e.target.value})}
                placeholder="Brief description of your project"
                className="w-full h-24 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Technical Skills *</label>
                <Input
                  required
                  value={userInfo.skills}
                  onChange={(e) => setUserInfo({...userInfo, skills: e.target.value})}
                  placeholder="e.g., React.js, Node.js, MongoDB"
                  className="w-full h-12 text-gray-900 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Certifications</label>
                <Input
                  value={userInfo.certificates}
                  onChange={(e) => setUserInfo({...userInfo, certificates: e.target.value})}
                  placeholder="Your professional certifications"
                  className="w-full h-12 text-gray-900 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Education Background *</label>
              <Input
                required
                value={userInfo.education}
                onChange={(e) => setUserInfo({...userInfo, education: e.target.value})}
                placeholder="Your educational background"
                className="w-full h-12 text-gray-900 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Work Experience *</label>
              <textarea
                required
                value={userInfo.experience}
                onChange={(e) => setUserInfo({...userInfo, experience: e.target.value})}
                placeholder="Describe your relevant work experience"
                className="w-full h-24 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">Interview Information</h3>
                  <p className="text-sm text-blue-800">This information will be used to personalize your interview experience. All fields marked with * are required.</p>
                </div>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Begin Interview Session
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Professional Header */}
      <div className="bg-white shadow-md border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <VideoIcon className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Live Interview Session</h1>
              <p className="text-sm text-gray-600">Technical Interview with AI Interviewer</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Live</span>
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium text-gray-700">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-4 min-h-0">
        <div className="h-full bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-300 relative">
            {connectionError ? (
              <div className="flex h-full items-center justify-center flex-col gap-6 bg-gray-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="size-8 text-red-600" />
                </div>
                <div className="text-center max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Issue</h3>
                  <p className="text-gray-600 mb-6">{connectionError}</p>
                  {errorType === "credits_exhausted" ? (
                    <Button 
                      onClick={retryConnection}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                      Retry Connection
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
                
                {/* User video (picture-in-picture) */}
                {localSessionId && (
                  <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden shadow-xl border-2 border-blue-500">
                    <Video
                      id={localSessionId}
                      className="w-full h-full"
                      tileClassName="!object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                      You
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center flex-col gap-6 bg-gray-100">
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
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleAudio}
            className={cn(
              "w-14 h-14 rounded-full border-2 transition-all duration-200 shadow-lg",
              !isMicEnabled 
                ? "bg-red-500 hover:bg-red-600 border-red-500 text-white" 
                : "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700"
            )}
          >
            {!isMicEnabled ? (
              <MicOffIcon className="size-6" />
            ) : (
              <MicIcon className="size-6" />
            )}
          </Button>
          
          <Button
            onClick={toggleVideo}
            className={cn(
              "w-14 h-14 rounded-full border-2 transition-all duration-200 shadow-lg",
              !isCameraEnabled 
                ? "bg-red-500 hover:bg-red-600 border-red-500 text-white" 
                : "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700"
            )}
          >
            {!isCameraEnabled ? (
              <VideoOffIcon className="size-6" />
            ) : (
              <VideoIcon className="size-6" />
            )}
          </Button>
          
          <Button
            onClick={leaveConversation}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 border-2 border-red-500 text-white transition-all duration-200 shadow-lg"
          >
            <PhoneIcon className="size-6 rotate-[135deg]" />
          </Button>
        </div>
        
        <div className="flex items-center justify-center mt-4 gap-6 text-sm text-gray-600">
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