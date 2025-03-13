"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, RefreshCcw, Bot } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string }[]
  >([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");

    // Simulating AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "My Strong Girl , How is everything going on ? Want to share something with me ? ",
        },
      ]);
    }, 1000);
  };

  const resetChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pink-100 p-6">
      {/* Header */}
      <Card className="w-full max-w-2xl bg-pink-200 flex justify-between items-center p-4 rounded-xl shadow-md">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-pink-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Maatri.AI : Your AI Soulmate
          </h2>
        </div>
        <Button onClick={resetChat} variant="ghost">
          <RefreshCcw className="w-5 h-5" />
        </Button>
      </Card>

      {/* Chat Messages */}
      <ScrollArea className="w-full max-w-2xl h-96 bg-white rounded-lg shadow-md p-4 my-4 overflow-y-auto border border-pink-300">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">
            How are you feeling Today ?
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start mb-4 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "ai" && (
                <Avatar className="mr-2">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <Card
                className={`p-3 rounded-lg max-w-xs ${
                  msg.sender === "user"
                    ? "bg-pink-500 text-white"
                    : "bg-pink-200 text-gray-900"
                }`}
              >
                {msg.text}
              </Card>
            </div>
          ))
        )}
      </ScrollArea>

      {/* Chat Input */}
      <div className="w-full max-w-2xl flex items-center gap-2">
        <Input
          className="flex-1 border border-pink-300"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button onClick={sendMessage} className="bg-pink-500 text-white">
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
