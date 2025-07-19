import { TIME_LIMIT } from "@/config";
import { getSessionTime } from "@/utils";
import { useEffect, useState } from "react";

const formatTime = (duration: number) => {
  if (!duration) return "0:00";

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
};

export const Timer = () => {
  const [time, setTime] = useState(() => {
    const sessionTime = getSessionTime();
    return TIME_LIMIT - sessionTime;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const sessionTime = getSessionTime();
      setTime(TIME_LIMIT - sessionTime);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium text-gray-700">
      {formatTime(time)}
    </div>
  );
};
