"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Camera, Image, Bot, PlusCircle, Menu } from "lucide-react";

export default function VisionAssistant() {
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text?: string; image?: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [previousChats, setPreviousChats] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "I'm here to support you. How can I assist?" },
      ]);
    }, 1000);
  };

  const startNewChat = () => {
    if (messages.length > 0) {
      setPreviousChats((prev) => [
        `Chat ${prev.length + 1}`,
        ...prev,
      ]);
    }
    setMessages([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setMessages((prev) => [...prev, { sender: "user", image: reader.result }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setMessages((prev) => [...prev, { sender: "user", image: reader.result }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCamera = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();
        document.body.appendChild(video);
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-pink-100 via-white to-pink-200 p-6" onDragOver={handleDragOver} onDrop={handleDrop}>
      {/* Sidebar for Previous Chats */}
      {showSidebar && (
        <Card className="w-64 bg-pink-200 p-3 rounded-xl shadow-md mr-4">
          <h3 className="text-lg font-semibold text-gray-900">Previous Chats</h3>
          <ScrollArea className="h-60 mt-2 overflow-y-auto">
            {previousChats.map((chat, index) => (
              <div key={index} className="p-2 border-b border-pink-300 cursor-pointer hover:bg-pink-100">{chat}</div>
            ))}
          </ScrollArea>
        </Card>
      )}

      {/* Main Chat Section */}
      <div className="flex flex-col items-center justify-center flex-grow">
        {/* Header */}
        <Card className="w-full max-w-2xl bg-pink-200 flex justify-between items-center p-3 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-pink-600" />
            <h2 className="text-lg font-semibold text-gray-900">Vision Assistant</h2>
          </div>
          <div className="flex gap-2">
            <Button onClick={startNewChat} className="bg-pink-500 text-white">
              <PlusCircle className="w-5 h-5 mr-2" /> New Chat
            </Button>
            <Button onClick={() => setShowSidebar(!showSidebar)} className="bg-gray-500 text-white">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </Card>

        {/* Chat Messages */}
        <ScrollArea className="w-full max-w-2xl h-96 bg-white rounded-lg shadow-md p-4 my-4 overflow-y-auto border border-pink-300">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">How are you feeling today?</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start mb-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "ai" && (
                  <Avatar className="mr-2">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <Card
                  className={`p-3 rounded-lg max-w-xs ${
                    msg.sender === "user" ? "bg-pink-500 text-white" : "bg-pink-200 text-gray-900"
                  }`}
                >
                  {msg.text && <p>{msg.text}</p>}
                  {msg.image && <img src={msg.image} alt="Uploaded" className="rounded-lg mt-2 max-w-full" />}
                </Card>
              </div>
            ))
          )}
        </ScrollArea>

        {/* Chat Input & Buttons */}
        <div className="w-full max-w-2xl flex items-center gap-2">
          <Input
            className="flex-1 border border-pink-300"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={sendMessage} className="bg-pink-500 text-white">
            <Send className="w-5 h-5" />
          </Button>
          <Button onClick={openCamera} className="bg-purple-500 text-white">
            <Camera className="w-5 h-5" />
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-500 text-white">
            <Image className="w-5 h-5" />
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
        </div>
      </div>
    </div>
  );
}
