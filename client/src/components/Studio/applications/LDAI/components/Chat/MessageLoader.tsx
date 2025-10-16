// frontend/src/applications/LDAI/components/Chat/MessageLoader.tsx
export default function MessageLoader() {
  return (
    <div className="flex justify-start pl-2">
      <div className="bg-gray-200 text-gray-500 text-xl rounded-xl px-2 py-0.5 flex gap-1 items-center">
        <span className="animate-bounce" style={{ animationDelay: "0s" }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
      </div>
    </div>
  );
}
