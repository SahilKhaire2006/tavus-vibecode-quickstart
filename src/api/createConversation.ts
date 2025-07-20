import { IConversation } from "@/types";

export const createConversation = async (
  userInfo: any
): Promise<IConversation> => {
  // Hardcoded credentials
  const token = "90679945b9fa40b4943fb8c3b64ca59e";
  const persona_id = "p8e035c0f938";
  const replica_id = "r880666f8c89";
  
  console.log("Creating conversation with hardcoded token");
  
  // Build conversational context with user information
  const conversationalContext = JSON.stringify({
    candidate_name: userInfo.name,
    project_title: userInfo.projectTitle,
    project_summary: userInfo.projectSummary,
    skills: userInfo.skills,
    certificates: userInfo.certificates,
    education: userInfo.education,
    experience: userInfo.experience,
    current_stage: "1",
    interview_score: null,
    greeting: "Good Morning"
  });
  
  const payload = {
    persona_id: persona_id,
    replica_id: replica_id,
    custom_greeting: "Hello! I'm Sarah Mitchell, your AI interviewer. I'll be conducting this technical interview today. I'm excited to learn about your background and experience. Let's start with a brief introduction - could you tell me about your professional journey and what motivates you in your career?",
    conversational_context: conversationalContext,
    properties: {
      max_call_duration: 1800,
      participant_left_timeout: 60,
      enable_recording: false
    }
  };
  
  console.log('Sending payload to API:', payload);
  
  try {
    const response = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": token,
      },
      body: JSON.stringify(payload),
    });

    console.log("API Response status:", response.status);
    
    if (!response?.ok) {
      const errorText = await response.text();
      console.error("API Error response:", errorText);
      
      // Handle specific error cases
      if (response.status === 402) {
        throw new Error("CREDITS_EXHAUSTED");
      }
      
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log("Conversation created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};
