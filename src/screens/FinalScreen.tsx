import { DialogWrapper, AnimatedTextBlockWrapper } from "@/components/DialogWrapper";
import React from "react";
import { useAtom } from "jotai";
import { screenAtom } from "@/store/screens";
import { Button } from "@/components/ui/button";
import { evaluationMetricsAtom, conversationMessagesAtom } from "@/store/conversation";
import { Download, BarChart3 } from "lucide-react";

export const FinalScreen: React.FC = () => {
  const [, setScreenState] = useAtom(screenAtom);
  const [evaluationMetrics] = useAtom(evaluationMetricsAtom);
  const [conversationMessages] = useAtom(conversationMessagesAtom);

  const handleReturn = () => {
    setScreenState({ currentScreen: "intro" });
  };

  const exportDataForProgressTracker = () => {
    const exportData = {
      conversation: conversationMessages,
      evaluation: evaluationMetrics,
      timestamp: new Date().toISOString(),
      totalMessages: conversationMessages.length,
      userMessages: conversationMessages.filter(msg => msg.speaker === 'user').length
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <DialogWrapper>
      <AnimatedTextBlockWrapper>
        <div className="flex flex-col items-center justify-center gap-6 py-12 max-w-2xl">
          <h1 className="text-3xl font-bold text-white mb-4 text-center">Thank you for your conversation!</h1>
          
          {evaluationMetrics && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 w-full mb-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="size-5" />
                Interview Performance Summary
              </h2>
              <div className="grid grid-cols-2 gap-4 text-white">
                <div>
                  <p className="text-sm opacity-80">Technical Knowledge</p>
                  <p className="text-2xl font-bold">{evaluationMetrics.technicalKnowledge.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Communication Skills</p>
                  <p className="text-2xl font-bold">{evaluationMetrics.communicationSkills.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Confidence</p>
                  <p className="text-2xl font-bold">{evaluationMetrics.confidence.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Overall Score</p>
                  <p className="text-2xl font-bold text-primary">{evaluationMetrics.overallScore.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-4 flex-wrap justify-center">
            {conversationMessages.length > 0 && (
              <Button
                onClick={exportDataForProgressTracker}
                className="relative z-20 flex items-center justify-center gap-2 rounded-3xl border border-[rgba(255,255,255,0.3)] px-6 py-3 text-base text-white transition-all duration-200 hover:text-primary disabled:opacity-50"
                style={{
                  height: '48px',
                  transition: 'all 0.2s ease-in-out',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(34, 197, 254, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Download className="size-5" />
                Export for Progress Tracker
              </Button>
            )}
            
            <Button
              onClick={handleReturn}
              className="relative z-20 flex items-center justify-center gap-2 rounded-3xl border border-[rgba(255,255,255,0.3)] px-8 py-3 text-base text-white transition-all duration-200 hover:text-primary disabled:opacity-50"
              style={{
                height: '48px',
                transition: 'all 0.2s ease-in-out',
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(34, 197, 254, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Return to Main Screen
            </Button>
          </div>
          {/* <Button
            onClick={handleReturn}
            className="relative z-20 flex items-center justify-center gap-2 rounded-3xl border border-[rgba(255,255,255,0.3)] px-8 py-3 text-base text-white transition-all duration-200 hover:text-primary disabled:opacity-50"
            style={{
              height: '48px',
              transition: 'all 0.2s ease-in-out',
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 15px rgba(34, 197, 254, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Return to Main Screen
          </Button> */}
        </div>
      </AnimatedTextBlockWrapper>
    </DialogWrapper>
  );
};
