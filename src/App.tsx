import { useAtom } from "jotai";
import { screenAtom } from "./store/screens";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import {
  IntroLoading,
  Outage,
  OutOfMinutes,
  Intro,
  Instructions,
  InterviewChat,
  Conversation,
  FinalScreen,
  Settings,
} from "./screens";

function App() {
  const [{ currentScreen }] = useAtom(screenAtom);

  const renderScreen = () => {
    switch (currentScreen) {
      case "introLoading":
        return <IntroLoading />;
      case "outage":
        return <Outage />;
      case "outOfMinutes":
        return <OutOfMinutes />;
      case "intro":
        return <Intro />;
      case "settings":
        return <Settings />;
      case "instructions":
        return <Instructions />;
      case "interviewChat":
        return <InterviewChat />;
      case "conversation":
        return <Conversation />;
      case "finalScreen":
        return <FinalScreen />;
      default:
        return <IntroLoading />;
    }
  };

  return (
    <main className={currentScreen === "interviewChat" ? "h-screen bg-gray-50" : "flex h-svh flex-col items-center justify-between gap-3 p-5 sm:gap-4 lg:p-8 bg-black"}>
      {currentScreen !== "introLoading" && currentScreen !== "interviewChat" && <Header />}
      {renderScreen()}
      {currentScreen !== "introLoading" && currentScreen !== "interviewChat" && <Footer />}
    </main>
  );
}

export default App;
