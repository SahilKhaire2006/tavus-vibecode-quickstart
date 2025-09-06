import { IConversation } from "@/types";

export const createConversation = async (
  userInfo: any
): Promise<IConversation> => {
  // Get token from localStorage
  const token = localStorage.getItem('tavus-token');
  
  if (!token) {
    throw new Error("API token is required. Please enter your Tavus API token.");
  }
  
  const persona_id = "p25e042a1eb6";
  const replica_id = "rf4703150052";
  
  console.log("Creating conversation with:");
  console.log("Token:", token ? `${token.substring(0, 8)}...` : "No token");
  console.log("Using persona_id:", persona_id);
  console.log("Using replica_id:", replica_id);
  
  // Validate persona_id format
  if (!persona_id || !persona_id.startsWith('p')) {
    throw new Error("Invalid persona_id format");
  }
  
  // Validate replica_id format  
  if (!replica_id || !replica_id.startsWith('r')) {
    throw new Error("Invalid replica_id format");
  }
  
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
    custom_greeting: `Hello ${userInfo.name}! I'm your AI interviewer. I'll be conducting this technical interview today. I'm excited to learn about your background and experience with ${userInfo.skills}. Let's start with a brief introduction - could you tell me about your professional journey and what motivates you in your career?`,
    conversational_context: conversationalContext,
    properties: {
      max_call_duration: 1800,
      participant_left_timeout: 60,
      enable_recording: false
    }
  };
  
  console.log('Sending payload to API:', payload);
  
  try {
    // First, let's validate the persona exists
    const validateResponse = await fetch(`https://tavusapi.com/v2/personas/${persona_id}`, {
      method: "GET",
      headers: {
        "x-api-key": token,
      },
    });
    
    if (!validateResponse.ok) {
      const validateError = await validateResponse.text();
      console.error("Persona validation failed:", validateError);
      throw new Error(`Invalid persona_id: ${persona_id}. Please check your Tavus account for available personas.`);
    }
    
    console.log("Persona validation successful");
    
    // Now create the conversation
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
      
      let errorObj;
      try {
        errorObj = JSON.parse(errorText);
      } catch {
        errorObj = { message: errorText };
      }
      
      // Handle specific error cases
      if (response.status === 402) {
        throw new Error("CREDITS_EXHAUSTED");
      }
      
      if (response.status === 400 && errorObj.message?.includes("persona_id")) {
        throw new Error(`Invalid persona_id: ${persona_id}. This persona may not exist in your Tavus account or may not be available for conversations.`);
      }
      
      if (response.status === 401) {
        throw new Error("Invalid API token. Please check your Tavus API key.");
      }
      
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorObj.message || errorText}`);
    }

    const data = await response.json();
    console.log("Conversation created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};
