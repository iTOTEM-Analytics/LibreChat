import ChatWindow from "../components/Chat/ChatWindow";
import ActionPanel from "../components/Chat/ActionPanel";

export default function LDAIChatPage() {
  return (
    <div className="flex flex-row overflow-hidden h-[calc(100vh-64px)] w-full">
      <div className="flex flex-col flex-1 h-full">
        <ChatWindow />
      </div>
      <ActionPanel />
    </div>
  );
}
