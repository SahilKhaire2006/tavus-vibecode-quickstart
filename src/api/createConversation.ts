import { IConversation } from "@/types";
import { settingsAtom } from "@/store/settings";
import { getDefaultStore } from "jotai";

export const createConversation = async (
  token: string,
): Promise<IConversation> => {
  console.log("Creating conversation with token:", token?.substring(0, 8) + "...");
  
  // Get settings from Jotai store
  const settings = getDefaultStore().get(settingsAtom);
  
  // Add debug logs
  console.log('Creating conversation with settings:', settings);
  console.log('Greeting value:', settings.greeting);
  console.log('Context value:', settings.context);
  
  // Build the context string
  let contextString = "";
  if (settings.name) {
    contextString = `You are talking with the user, ${settings.name}. Additional context: `;
  }
  contextString += settings.context || "";
  
  const payload = {
    persona_id: settings.persona || "pb8f5bcd6326",
    replica_id: settings.replica || "rf4703150052",
    custom_greeting: settings.greeting !== undefined && settings.greeting !== null 
      ? settings.greeting 
      : "Hello! I'm Sarah Mitchell, your AI interviewer. I'll be conducting this technical interview today. I'm excited to learn about your background and experience. Let's start with a brief introduction - could you tell me about your professional journey and what motivates you in your career?",
    conversational_context: contextString,
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
        "x-api-key": token ?? "",
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
