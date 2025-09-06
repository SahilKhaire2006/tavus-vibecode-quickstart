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
import { conversationMessagesAtom, ConversationMessage, evaluationMetricsAtom, EvaluationMetrics } from "@/store/conversation";
import jsPDF from 'jspdf';

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
  const [interviewerName] = useState("Michael Johnson");
  const [interviewerTitle] = useState("Senior Technical Interviewer");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [conversationMessages, setConversationMessages] = useAtom(conversationMessagesAtom);
  const [evaluationMetrics, setEvaluationMetrics] = useAtom(evaluationMetricsAtom);

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
    // Clear previous conversation data
    setConversationMessages([]);
    setEvaluationMetrics(null);
  };

  // Initialize conversation with better error handling
  useEffect(() => {
    const initializeConversation = async () => {
      if (!conversation && !showForm && userInfo.name) {
        try {
          console.log("Initializing conversation with user info:", userInfo);
          
          // Check if token exists
          const token = localStorage.getItem('tavus-token');
          if (!token) {
            setConnectionError("Please enter your Tavus API token first");
            setErrorType("no_token");
            setIsInitializing(false);
            return;
          }

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
            if (errorMessage.includes("Invalid persona_id")) {
              setConnectionError(`Persona Error: The persona ID 'p25e042a1eb6' is not available in your Tavus account. Please check your Tavus dashboard at https://platform.tavus.io/personas to see available personas.`);
            } else if (errorMessage.includes("Invalid API token")) {
              setConnectionError("Invalid API token. Please check your Tavus API key and try again.");
            } else {
              setConnectionError(`Connection failed: ${errorMessage}`);
            }
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

  // Listen for conversation events and transcripts
  useDailyEvent(
    "app-message",
    useCallback((event: any) => {
      if (event.data) {
        // Only capture actual speech/utterance events with clean text
        if (event.data.event_type === 'conversation.utterance' && event.data.properties?.speech) {
          const message: ConversationMessage = {
            id: Date.now().toString(),
            timestamp: new Date(),
            speaker: event.data.properties?.role === 'user' ? 'user' : 'ai',
            message: event.data.properties.speech,
            type: 'app_message'
          };
          
          setConversationMessages(prev => [...prev, message]);
          console.log('Speech captured:', event.data.properties.speech);
        }
      }
    }, [setConversationMessages])
  );

  // Listen for transcription events (if available)
  useDailyEvent(
    "transcription-message",
    useCallback((event: any) => {
      if (event.text && event.text.trim()) {
        const message: ConversationMessage = {
          id: Date.now().toString(),
          timestamp: new Date(),
          speaker: event.participantId === localSessionId ? 'user' : 'ai',
          message: event.text,
          type: 'transcript'
        };
        
        setConversationMessages(prev => [...prev, message]);
      }
    }, [localSessionId, setConversationMessages])
  );

  // Generate evaluation based on conversation
  const generateEvaluation = useCallback(() => {
    if (conversationMessages.length === 0) return;

    // Simple evaluation logic - you can enhance this
    const userMessages = conversationMessages.filter(msg => msg.speaker === 'user');
    const totalMessages = userMessages.length;
    
    // Basic scoring algorithm
    const avgMessageLength = userMessages.reduce((acc, msg) => acc + msg.message.length, 0) / totalMessages || 0;
    const technicalKeywords = ['javascript', 'react', 'node', 'database', 'api', 'algorithm', 'function', 'variable'];
    const technicalScore = userMessages.reduce((score, msg) => {
      const matches = technicalKeywords.filter(keyword => 
        msg.message.toLowerCase().includes(keyword)
      ).length;
      return score + matches;
    }, 0);

    const evaluation: EvaluationMetrics = {
      technicalKnowledge: Math.min(100, (technicalScore / totalMessages) * 20),
      communicationSkills: Math.min(100, (avgMessageLength / 50) * 100),
      confidence: Math.min(100, totalMessages * 10),
      problemSolving: Math.min(100, (technicalScore / 2) * 10),
      overallScore: 0,
      feedback: [
        `Participated in ${totalMessages} exchanges`,
        `Average response length: ${Math.round(avgMessageLength)} characters`,
        `Technical keywords mentioned: ${technicalScore}`
      ]
    };
    
    evaluation.overallScore = (
      evaluation.technicalKnowledge + 
      evaluation.communicationSkills + 
      evaluation.confidence + 
      evaluation.problemSolving
    ) / 4;

    setEvaluationMetrics(evaluation);
  }, [conversationMessages, setEvaluationMetrics]);

  // Download conversation as PDF
  const downloadConversationPDF = useCallback(() => {
    if (conversationMessages.length === 0) {
      alert('No conversation to download');
      return;
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Title
    doc.setFontSize(16);
    doc.text('Interview Conversation Transcript', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.text(`Candidate: ${userInfo.name}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Add separator line
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    // Conversation with clean formatting
    doc.setFontSize(10);
    conversationMessages.forEach((message) => {
      const speaker = message.speaker === 'user' ? 'User' : 'Interviewer';
      const timestamp = message.timestamp.toLocaleTimeString();
      
      // Add timestamp
      if (yPosition + 15 > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`[${timestamp}]`, 20, yPosition);
      yPosition += 5;
      
      // Add speaker name
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(`${speaker}:`, 20, yPosition);
      yPosition += 5;
      
      // Add message content
      doc.setFont(undefined, 'normal');
      const messageLines = doc.splitTextToSize(message.message, 170);
      
      if (yPosition + (messageLines.length * 4) > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(messageLines, 20, yPosition);
      yPosition += messageLines.length * 4 + 8; // Extra space between messages
    });

    // Add evaluation if available
    if (evaluationMetrics) {
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Interview Evaluation', 20, yPosition);
      yPosition += 15;
      
      // Add separator line
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Technical Knowledge: ${evaluationMetrics.technicalKnowledge.toFixed(1)}%`, 20, yPosition);
      yPosition += 7;
      doc.text(`Communication Skills: ${evaluationMetrics.communicationSkills.toFixed(1)}%`, 20, yPosition);
      yPosition += 7;
      doc.text(`Confidence: ${evaluationMetrics.confidence.toFixed(1)}%`, 20, yPosition);
      yPosition += 7;
      doc.text(`Problem Solving: ${evaluationMetrics.problemSolving.toFixed(1)}%`, 20, yPosition);
      yPosition += 7;
      doc.setFont(undefined, 'bold');
      doc.text(`Overall Score: ${evaluationMetrics.overallScore.toFixed(1)}%`, 20, yPosition);
      yPosition += 15;
      
      doc.setFont(undefined, 'bold');
      doc.text('Feedback:', 20, yPosition);
      yPosition += 7;
      doc.setFont(undefined, 'normal');
      evaluationMetrics.feedback.forEach(feedback => {
        doc.text(`• ${feedback}`, 25, yPosition);
        yPosition += 7;
      });
    }

    doc.save(`interview-transcript-${userInfo.name}-${new Date().toISOString().split('T')[0]}.pdf`);
  }, [conversationMessages, evaluationMetrics, userInfo.name]);

  const toggleVideo = useCallback(() => {
    daily?.setLocalVideo(!isCameraEnabled);
  }, [daily, isCameraEnabled]);

  const toggleAudio = useCallback(() => {
    daily?.setLocalAudio(!isMicEnabled);
  }, [daily, isMicEnabled]);

  const leaveConversation = useCallback(() => {
    // Generate evaluation before leaving
    generateEvaluation();
    
    daily?.leave();
    daily?.destroy();
    if (conversation?.conversation_id) {
      endConversation("90679945b9fa40b4943fb8c3b64ca59e", conversation.conversation_id);
    }
    setConversation(null);
    clearSessionTime();
    setScreenState({ currentScreen: "finalScreen" });
  }, [daily, conversation, setConversation, setScreenState, generateEvaluation]);

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
        <div className="h-full bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-300 relative flex items-center justify-center">
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
                  className="w-full h-full max-w-full max-h-full"
                  tileClassName="!object-contain w-full h-full"
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
                  <div className="absolute bottom-6 right-6 w-52 h-40 bg-gray-900 rounded-lg overflow-hidden shadow-xl border-2 border-blue-500">
                    <Video
                      id={localSessionId}
                      className="w-full h-full"
                      tileClassName="!object-cover w-full h-full"
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
          {conversationMessages.length > 0 && (
            <Button
              onClick={downloadConversationPDF}
              className="w-14 h-14 rounded-full border-2 bg-green-500 hover:bg-green-600 border-green-500 text-white transition-all duration-200 shadow-lg"
            >
              <Download className="size-6" />
            </Button>
          )}
          
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