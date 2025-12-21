"use client";

import { useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  visualization?: {
    type: "table" | "bar" | "scalar";
    data: Record<string, unknown>[];
  };
  sql?: string;
}

const suggestedQuestions = [
  "What was our total revenue this month?",
  "Who are our top 5 customers?",
  "Which product category is performing best?",
  "How many orders did we get yesterday?",
];

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, includeSQL: true }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || "Sorry, I couldn't process that question.",
        visualization: data.visualization,
        sql: data.sql,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <header className="px-4 py-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#005F73]" />
          <h1 className="text-lg font-bold text-slate-900">Ask AI</h1>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          Ask questions about your sales data
        </p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 text-center">
              Try asking a question like:
            </p>
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(q)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  message.role === "user"
                    ? "bg-[#005F73] text-white"
                    : "bg-white border border-slate-200"
                }`}
              >
                <p className="text-sm">{message.content}</p>

                {/* Visualization */}
                {message.visualization && (
                  <div className="mt-3">
                    <DataVisualization
                      type={message.visualization.type}
                      data={message.visualization.data}
                    />
                  </div>
                )}

                {/* SQL Preview */}
                {message.sql && (
                  <details className="mt-2">
                    <summary className="text-xs text-slate-400 cursor-pointer">
                      View SQL
                    </summary>
                    <pre className="mt-1 text-xs bg-slate-100 p-2 rounded overflow-x-auto">
                      {message.sql}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-[#005F73]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your sales data..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="bg-[#005F73] hover:bg-[#004a5a]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function DataVisualization({
  type,
  data,
}: {
  type: "table" | "bar" | "scalar";
  data: Record<string, unknown>[];
}) {
  if (!data || data.length === 0) return null;

  if (type === "scalar" && data[0]) {
    const value = Object.values(data[0])[0];
    return (
      <div className="text-2xl font-bold text-[#005F73]">
        {String(value)}
      </div>
    );
  }

  if (type === "table") {
    const columns = Object.keys(data[0] || {});
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th key={col} className="text-left py-1 px-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, i) => (
              <tr key={i} className="border-b border-slate-100">
                {columns.map((col) => (
                  <td key={col} className="py-1 px-2">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Simple bar visualization
  if (type === "bar") {
    const maxValue = Math.max(
      ...data.map((d) => {
        const numericValue = Object.values(d).find(
          (v) => typeof v === "number"
        );
        return (numericValue as number) || 0;
      })
    );

    return (
      <div className="space-y-2">
        {data.slice(0, 5).map((row, i) => {
          const label = String(Object.values(row)[0] || "");
          const value = Object.values(row).find(
            (v) => typeof v === "number"
          ) as number;
          const width = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate">{label}</span>
                <span className="font-medium">{value?.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#005F73] rounded-full"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
