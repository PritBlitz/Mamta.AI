"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Bot,
  History,
  ChevronLeft,
  ChevronRight,
  Mic,
  MessageCircle,
} from "lucide-react";

// Add a proper type declaration for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type Message = {
  sender: "user" | "ai";
  text: string;
};

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [previousChats, setPreviousChats] = useState<
    { topic: string; chats: string[] }[]
  >([]);
  const [showSidebar, setShowSidebar] = useState(true);
  // Removed unused variable isListening

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    const prompt = input;
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "ai", text: data.text }]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, something went wrong." },
      ]);
    }
  };

  const newChat = () => {
    setPreviousChats((prev) => [
      ...prev,
      {
        topic: `Chat ${prev.length + 1}`,
        chats: messages.map((msg) => msg.text),
      },
    ]);
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("Voice recognition started...");
    };

    recognition.onend = () => {
      console.log("Voice recognition ended.");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-row items-center justify-center min-h-screen bg-pink-200 p-6">
      {/* Sidebar Toggle */}
      <Button onClick={() => setShowSidebar(!showSidebar)} variant="ghost">
        {showSidebar ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </Button>

      {/* Sidebar */}
      {showSidebar && (
        <Card className="w-1/5 bg-white p-4 rounded-lg shadow-md my-4 border border-pink-300">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-semibold text-gray-700">
              Previous Chats
            </h3>
          </div>
          <ScrollArea className="h-96 overflow-y-auto">
            <Card className="p-2 my-2 bg-blue-100 rounded-md cursor-pointer">
              💙 Emotional Assistance
            </Card>
            <Card className="p-2 my-2 bg-green-100 rounded-md cursor-pointer">
              🏥 Health Queries
            </Card>
            <Card className="p-2 my-2 bg-yellow-100 rounded-md cursor-pointer">
              💡 General Advice
            </Card>
            {previousChats.length === 0 ? (
              <p className="text-gray-500 text-center">
                No previous conversations yet.
              </p>
            ) : (
              previousChats.map((chat, index) => (
                <Card key={index} className="p-2 my-2 bg-pink-50 rounded-md">
                  <h4 className="text-gray-900 font-semibold">{chat.topic}</h4>
                </Card>
              ))
            )}
          </ScrollArea>
        </Card>
      )}

      {/* Main Chat Section */}
      <div className="flex flex-col items-center w-4/5">
        <Card className="w-full bg-pink-300 flex justify-between items-center p-2 rounded-xl shadow-md mb-2">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-pink-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Mamta.AI : Your AI Soulmate
            </h2>
          </div>
          <Button onClick={newChat} variant="ghost">
            <MessageCircle className="w-5 h-5" />
            <span className="ml-2">New Chat</span>
          </Button>
        </Card>

        <ScrollArea className="w-full h-[80vh] bg-white rounded-lg shadow-md p-4 my-2 overflow-y-auto border border-pink-300">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">
              How are you feeling today?
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
                  className={`p-3 rounded-lg ${
                    msg.sender === "user"
                      ? "bg-pink-500 text-white max-w-md"
                      : "bg-pink-100 text-gray-900 max-w-2xl"
                  }`}
                >
                  {msg.text}
                </Card>
              </div>
            ))
          )}
        </ScrollArea>

        <div className="w-full flex items-center gap-2">
          <Input
            className="flex-1 border border-pink-300"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button onClick={startListening} className="bg-pink-500 text-white">
            <Mic className="w-5 h-5" />
          </Button>
          <Button onClick={sendMessage} className="bg-pink-500 text-white">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
