import { atom } from "jotai";
import { IConversation } from "../types";

const initialConversationState: IConversation | null = null;

export const conversationAtom = atom<IConversation | null>(
  initialConversationState,
);

// Store conversation messages
export interface ConversationMessage {
  id: string;
  timestamp: Date;
  speaker: 'user' | 'ai';
  message: string;
  type: 'transcript' | 'app_message';
}

export const conversationMessagesAtom = atom<ConversationMessage[]>([]);

// Store evaluation metrics
export interface EvaluationMetrics {
  technicalKnowledge: number;
  communicationSkills: number;
  confidence: number;
  problemSolving: number;
  overallScore: number;
  feedback: string[];
}

export const evaluationMetricsAtom = atom<EvaluationMetrics | null>(null);