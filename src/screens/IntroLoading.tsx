import React, { useEffect, useState } from "react";
import { healthCheckApi } from "@/api";
import { screenAtom } from "@/store/screens";
import { useAtom } from "jotai";
import { quantum } from 'ldrs';

const screens = {
  error: "outage",
  success: "intro",
  outOfTime: "outOfMinutes",
} as const;

const useHealthCheck = () => {
  const [screenState, setScreenState] = useState<keyof typeof screens | null>(
    null,
  );

  const healthCheck = async (): Promise<void> => {
    try {
      const response = await healthCheckApi();
      if (response?.status) {
        setScreenState("success");
      } else {
        setScreenState("error");
      }
    } catch (error) {
      setScreenState("error");
    }
  };

  useEffect(() => {
    healthCheck();
  }, []);

  return { screenState };
};

quantum.register();

export const IntroLoading: React.FC = () => {
  const { screenState } = useHealthCheck();
  const [, setScreenState] = useAtom(screenAtom);

  useEffect(() => {
    if (screenState !== null) {
      const timer = setTimeout(() => {
        setScreenState({ currentScreen: "interviewChat" });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [screenState]);

  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <l-quantum
        size="45"
        speed="1.75"
        color="white"
      ></l-quantum>
    </div>
  );
};
