// frontend/src/applications/LDAI/components/Chat/Message.tsx
import { Reply } from "lucide-react";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  refId?: string;
  onReply?: (refId: string) => void;
}

// Simple markdown parser for basic formatting
function parseMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  
  // Define markdown patterns with their replacements
  const patterns = [
    { regex: /\*\*(.*?)\*\*/g, tag: 'strong', className: 'font-semibold' }, // Bold
    { regex: /\*(.*?)\*/g, tag: 'em', className: 'italic' }, // Italic
    { regex: /`(.*?)`/g, tag: 'code', className: 'bg-gray-200 px-1 py-0.5 rounded text-xs font-mono' }, // Inline code
    { regex: /~~(.*?)~~/g, tag: 'del', className: 'line-through text-gray-500' }, // Strikethrough
  ];
  
  // Process text through all patterns
  let processedText = text;
  let textParts: Array<{ text: string; type: string; className?: string; start: number; end: number }> = [];
  
  patterns.forEach(({ regex, tag, className }) => {
    let match;
    while ((match = regex.exec(processedText)) !== null) {
      textParts.push({
        text: match[1],
        type: tag,
        className,
        start: match.index,
        end: match.index + match[0].length
      });
    }
  });
  
  // Sort parts by start position
  textParts.sort((a, b) => a.start - b.start);
  
  // Build the final result
  let lastIndex = 0;
  
  textParts.forEach((part, index) => {
    // Add text before this part
    if (part.start > lastIndex) {
      parts.push(processedText.substring(lastIndex, part.start));
    }
    
    // Add the formatted part based on type
    switch (part.type) {
      case 'strong':
        parts.push(
          <strong key={`${part.type}-${index}`} className={part.className}>
            {part.text}
          </strong>
        );
        break;
      case 'em':
        parts.push(
          <em key={`${part.type}-${index}`} className={part.className}>
            {part.text}
          </em>
        );
        break;
      case 'code':
        parts.push(
          <code key={`${part.type}-${index}`} className={part.className}>
            {part.text}
          </code>
        );
        break;
      case 'del':
        parts.push(
          <del key={`${part.type}-${index}`} className={part.className}>
            {part.text}
          </del>
        );
        break;
      default:
        parts.push(part.text);
    }
    
    lastIndex = part.end;
  });
  
  // Add remaining text
  if (lastIndex < processedText.length) {
    parts.push(processedText.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
}

export default function Message({ role, content, refId, onReply }: MessageProps) {
  const isUser = role === "user";
  const isEmpty = !content || content.trim() === "";
  
  return (
    <div className={`relative flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[75%] px-4 py-2 rounded-lg text-sm shadow-sm ${
          isUser
            ? "bg-teal-600 text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        }`}
      >
        {isEmpty && role === "assistant" ? (
          // Show 3-dots loader when content is empty (assistant is typing)
          <div className="flex gap-1 items-center">
            <span className="animate-bounce" style={{ animationDelay: "0s" }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {role === "assistant" && content.includes("?") ? (
              <div>
                {(() => {
                  // Find the last question in the text
                  const lastQuestionIndex = content.lastIndexOf("?");
                  if (lastQuestionIndex === -1) return parseMarkdown(content);
                  
                  // Find the start of the last sentence (look for previous sentence ending)
                  let sentenceStart = 0;
                  for (let i = lastQuestionIndex - 1; i >= 0; i--) {
                    if (content[i] === '.' || content[i] === '!' || content[i] === '\n') {
                      sentenceStart = i + 1;
                      break;
                    }
                  }
                  
                  // Extract the last question sentence
                  const lastQuestion = content.substring(sentenceStart, lastQuestionIndex + 1).trim();
                  const beforeQuestion = content.substring(0, sentenceStart);
                  const afterQuestion = content.substring(lastQuestionIndex + 1);
                  
                  return (
                    <>
                      {parseMarkdown(beforeQuestion)}
                      <span className="font-bold">{parseMarkdown(lastQuestion)}</span>
                      {parseMarkdown(afterQuestion)}
                    </>
                  );
                })()}
              </div>
            ) : (
              parseMarkdown(content)
            )}
          </div>
        )}

        {!isUser && !isEmpty && (
          <div className="mt-1 flex items-center gap-2 justify-end">
            {refId && <span className="text-[11px] text-gray-500 font-mono">#{refId}</span>}
            <button
              title="Reply to this turn"
              onClick={() => refId && onReply?.(refId)}
              className="p-1 rounded hover:bg-gray-200 text-gray-500"
            >
              <Reply size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
