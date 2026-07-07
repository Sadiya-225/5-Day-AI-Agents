"use client";
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Bot,
  SendIcon,
  User,
  Plus,
  Trash2,
  Sidebar,
  MessageCircle,
  Lock,
  CreditCard,
  Paperclip,
  FileText,
  X,
  Mic,
  MicOff,
  Video,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import EmergencyButton from "@/components/emergency-button";

export default function ChatUI() {
  const router = useRouter();
  const params = useParams();
  const endRef = useRef(null);

  const { userId } = useAuth();
  const [chatId, setChatId] = useState(params?.chatId || null);
  const [chats, setChats] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userCredits, setUserCredits] = useState(0);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your MedSync AI Assistant. How Can I Help You With Your Medical Questions Today?",
      isEmergency: false,
    },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [unlockChat, setUnlockChat] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (userId) {
      fetchChats();
      fetchUserCredits();
      if (chatId) fetchMessages(chatId);
    }
  }, [userId, chatId]);

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== "undefined") {
      if (
        "webkitSpeechRecognition" in window ||
        "SpeechRecognition" in window
      ) {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("");
          setText(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        console.warn("Browser does not support Speech Recognition API");
      }
    }
  }, []);

  async function fetchUserCredits() {
    try {
      const response = await fetch("/api/user/credits");
      const data = await response.json();
      if (data.credits !== undefined) {
        setUserCredits(data.credits);
      }
    } catch (error) {
      console.error("Error Fetching User Credits:", error);
    }
  }

  async function fetchChats() {
    try {
      const response = await fetch("/api/chat/history");
      const data = await response.json();
      if (data.chats) setChats(data.chats);
    } catch (error) {
      console.error("Error Fetching Chats:", error);
    }
  }

  async function fetchMessages(id) {
    try {
      const response = await fetch(`/api/chat/messages?chatId=${id}`);
      const data = await response.json();
      if (data.messages && data.messages.length > 0) {
        setMessages(
          data.messages.map((msg) => ({
            role: msg.role.toLowerCase(),
            content: msg.content,
            isEmergency: msg.isEmergency || false,
            videos: msg.videos || null,
          }))
        );
      } else {
        setMessages([
          {
            role: "assistant",
            content:
              "Hello! I'm your MedSync AI Assistant. How Can I Help You With Your Medical Questions Today?",
            isEmergency: false,
          },
        ]);
      }
    } catch (error) {
      console.error("Error Fetching Messages:", error);
    }
  }

  function startNewChat() {
    if (userCredits < 500) {
      setShowCreditDialog(true);
      return;
    } else if (chatId) {
      router.push("/ai-assistant/chat");
    } else {
      deductCreditsAndStartChat();
    }
  }

  async function deductCreditsAndStartChat() {
    try {
      const response = await fetch("/api/chat/deduct-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 500 }),
      });

      const data = await response.json();

      if (data.success) {
        setChatId(null);
        setMessages([
          {
            role: "assistant",
            content:
              "Hello! I'm your MedSync AI Assistant. How Can I Help You With Your Medical Questions Today?",
            isEmergency: false,
          },
        ]);
        setUnlockChat(true);
        router.push("/ai-assistant/chat");
        fetchUserCredits();
      } else {
        console.error("Failed to Deduct Credits:", data.error);
      }
    } catch (error) {
      console.error("Error Deducting Credits:", error);
    }
  }

  function switchChat(id) {
    setChatId(id);
    router.push(`/ai-assistant/${id}`);
    fetchMessages(id);
    setMobileSidebarOpen(false);
  }

  async function deleteChat(id, e) {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/${id}`, { method: "DELETE" });
      fetchChats();
      if (chatId === id) startNewChat();
    } catch (error) {
      console.error("Error Deleting Chat:", error);
    }
  }

  async function sendMessage(e) {
    if (e) e.preventDefault();
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text, isEmergency: false };
    setMessages((m) => [...m, userMsg]);
    setText("");
    setLoading(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          chatId: chatId,
          messageHistory: messages,
        }),
      });
      const json = await r.json();
      if (json.answer) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: json.answer,
            isEmergency: json.isEmergency || false,
            videos: json.videos || null,
          },
        ]);
        if (json.chatId && !chatId) {
          setChatId(json.chatId);
          router.push(`/ai-assistant/${json.chatId}`);
          fetchChats();
        }
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: json.error || "No Response",
            isEmergency: false,
          },
        ]);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Error: ${err.message}`,
          isEmergency: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      alert("Please Select a PDF file");
    }
  }

  function removeSelectedFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadPDF() {
    if (!selectedFile) return;

    setUploadingPDF(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/chat/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const uploadMsg = {
          role: "user",
          content: `I've Uploaded a New Medical Report. Please Analyze This Newly Uploaded Report Carefully and Provide Insights Considering my Previous Medical History.`,
          isEmergency: false,
        };

        setMessages((m) => [...m, uploadMsg]);
        removeSelectedFile();

        setLoading(true);
        try {
          const aiResponse = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: uploadMsg.content,
              chatId: chatId,
              messageHistory: [...messages, uploadMsg],
            }),
          });

          const json = await aiResponse.json();
          if (json.answer) {
            setMessages((m) => [
              ...m,
              {
                role: "assistant",
                content: json.answer,
                isEmergency: json.isEmergency || false,
              },
            ]);
            if (json.chatId && !chatId) {
              setChatId(json.chatId);
              router.push(`/ai-assistant/${json.chatId}`);
              fetchChats();
            }
          } else {
            setMessages((m) => [
              ...m,
              {
                role: "assistant",
                content: json.error || "No Response",
                isEmergency: false,
              },
            ]);
          }
        } catch (err) {
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              content: `Error: ${err.message}`,
              isEmergency: false,
            },
          ]);
        } finally {
          setLoading(false);
        }
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "user",
            content: `Error Uploading Document: ${data.error}`,
            isEmergency: false,
          },
        ]);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "user",
          content: `Error Uploading Document: ${err.message}`,
          isEmergency: false,
        },
      ]);
    } finally {
      setUploadingPDF(false);
    }
  }

  function toggleVoiceInput() {
    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  return (
    <div className="flex h-screen w-full mx-auto relative bg-background">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex ${
          sidebarOpen ? "w-64" : "w-16"
        } transition-all duration-300 bg-card border-r border-emerald-600/30 flex-col h-full`}
      >
        <SidebarContent
          chats={chats}
          sidebarOpen={sidebarOpen}
          chatId={chatId}
          startNewChat={startNewChat}
          switchChat={switchChat}
          deleteChat={deleteChat}
          userCredits={userCredits}
        />
      </div>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          mobileSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } bg-background/50`}
        onClick={() => setMobileSidebarOpen(false)}
      >
        <div
          className={`h-full w-64 bg-card border-r border-emerald-900/20 pt-4 transform transition-transform duration-300 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <SidebarContent
            chats={chats}
            sidebarOpen={true}
            chatId={chatId}
            startNewChat={startNewChat}
            switchChat={switchChat}
            deleteChat={deleteChat}
            userCredits={userCredits}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center px-4 py-2.5 border-b border-emerald-900/20 justify-between bg-card">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.innerWidth < 768) setMobileSidebarOpen(true);
                else setSidebarOpen(!sidebarOpen);
              }}
              className="mr-2 text-emerald-400 hover:text-emerald-300"
            >
              <Sidebar
                className={`h-5 w-5 text-emerald-400 transition-transform ${
                  sidebarOpen ? "rotate-0" : "rotate-180"
                }`}
              />
            </Button>
            <h2 className="text-xl font-semibold text-foreground">
              AI Medical Assistant
            </h2>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          <div className="w-full space-y-4">
            {messages.map((message, index) => (
              <div key={index}>
                <div
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-[80%] ${
                      message.role === "user"
                        ? "bg-emerald-600 text-white"
                        : "bg-card border border-emerald-900/20 text-foreground"
                    } rounded-lg p-3`}
                  >
                    <div className="shrink-0 items-center flex">
                      {message.role === "user" ? (
                        <User className="h-4.5 w-4.5 mr-2" />
                      ) : (
                        <Bot className="h-5 w-5 text-emerald-400 mr-3" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-line">
                        {message.content.replace(/\\n/g, "\n")}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Emergency Button Below Assistant Message */}
                {message.role === "assistant" && message.isEmergency && (
                  <div className="flex justify-start mt-3 ml-10">
                    <div className="flex flex-col gap-2 max-w-[80%]">
                      <div
                        className="
                          rounded-lg p-4 border-2
                          bg-red-50 border-red-400 text-red-900
                          dark:bg-red-950/70 dark:border-red-500 dark:text-red-200
                        "
                      >
                        <p className="font-bold text-md mb-2 text-red-600 dark:text-red-400">
                          ⚠️ Medical Emergency Detected
                        </p>

                        <p className="text-sm mb-3 text-red-800 dark:text-red-100">
                          This may be a life-threatening emergency. Please call
                          emergency services immediately.
                        </p>

                        <EmergencyButton />
                      </div>
                    </div>
                  </div>
                )}

                {/* Educational Videos Below Assistant Message */}
                {message.role === "assistant" && message.videos && message.videos.length > 0 && (
                  <div className="flex justify-start mt-3 ml-2 md:ml-10">
                    <div className="flex flex-col gap-4 w-full max-w-4xl">
                      {message.videos.map((video, videoIndex) => (
                        <div
                          key={videoIndex}
                          className="
                            rounded-xl p-4 border-2
                            bg-emerald-50 border-emerald-400
                            dark:bg-emerald-950/70 dark:border-emerald-500
                            w-full
                          "
                        >
                          <p className="font-bold text-lg mb-2 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <Video className="h-5 w-5 shrink-0" />
                            {video.title}
                          </p>

                          {video.description && (
                            <p className="text-sm mb-3 text-gray-700 dark:text-gray-300">
                              {video.description}
                            </p>
                          )}

                          {/* Responsive Video */}
                          <div className="
                            w-full
                            aspect-video
                            rounded-lg
                            overflow-hidden
                            bg-black
                            shadow-lg
                          ">
                            <iframe
                              src={video.url}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={video.title}
                            />
                          </div>

                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Source: {video.source} • {video.conditionName}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-emerald-900/20 text-foreground rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-emerald-400" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Input Area */}
        <form
          onSubmit={sendMessage}
          className="p-4 border-t border-emerald-900/20 bg-card"
        >
          {/* File Upload Preview */}
          {selectedFile && (
            <div className="mb-3 flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-900/20 border border-emerald-600/30 rounded-lg p-3">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-emerald-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  type="button"
                  onClick={uploadPDF}
                  disabled={uploadingPDF}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-sm"
                >
                  {uploadingPDF ? "Uploading..." : "Upload"}
                </Button>
                <Button
                  type="button"
                  onClick={removeSelectedFile}
                  disabled={uploadingPDF}
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploadingPDF || (!unlockChat && !chatId)}
              variant="ghost"
              size="icon"
              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 dark:bg-emerald-900/20"
              title="Upload Medical PDF"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  !unlockChat && !chatId
                    ? "Unlock Chat to Start"
                    : isListening
                    ? "Listening..."
                    : "Type Your Message or Use Voice..."
                }
                className="flex-1 bg-background border-emerald-900/20 text-foreground text-sm pr-12"
                disabled={loading || uploadingPDF || (!unlockChat && !chatId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                type="button"
                onClick={toggleVoiceInput}
                disabled={loading || uploadingPDF || (!unlockChat && !chatId)}
                variant="ghost"
                size="icon"
                className={`absolute right-1 top-1/2 -translate-y-1/2 ${
                  isListening
                    ? "text-red-500 hover:text-red-400 animate-pulse"
                    : "text-emerald-400 hover:text-emerald-300"
                } hover:bg-emerald-500/10 dark:bg-emerald-900/20`}
                title={isListening ? "Stop Recording" : "Start Voice Input"}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </div>
            <Button
              type="submit"
              disabled={loading || uploadingPDF || text.trim() === ""}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Credit Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent className="bg-card border border-emerald-900/20 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl">Insufficient Credits</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You Need 500 Credits to Start a New Chat. Please Purchase More
              Credits to Continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-emerald-500 mb-2">
                500
              </div>
              <div className="text-sm text-muted-foreground">
                Credits Required
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => router.push("/pricing")}
              className="bg-emerald-600 hover:bg-emerald-700 w-full"
            >
              Purchase Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SidebarContent({
  chats,
  sidebarOpen,
  chatId,
  startNewChat,
  switchChat,
  deleteChat,
  userCredits,
}) {
  const hasEnoughCredits = userCredits >= 500;
  return (
    <>
      <div className="p-3 border-b border-emerald-900/20 flex justify-between items-center">
        {sidebarOpen && (
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-foreground px-2">Chat History</h3>
            <div className="text-sm text-emerald-400 flex items-center">
              <CreditCard className="h-4 w-4 mr-1" />
              {userCredits}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={startNewChat}
          className={`${
            hasEnoughCredits
              ? "text-emerald-500 hover:text-emerald-300"
              : "text-gray-500"
          }`}
        >
          {hasEnoughCredits ? (
            <Plus className="h-5 w-5" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="px-5 py-4 text-sm text-muted-foreground">
            {sidebarOpen ? "No Chat History" : ""}
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => switchChat(chat.id)}
                className={`group flex items-center ${
                  sidebarOpen
                    ? "justify-between px-3 py-0.5"
                    : "justify-center py-2"
                } rounded-md cursor-pointer hover:bg-emerald-500/10 dark:bg-emerald-900/20 ${
                  chatId === chat.id ? "bg-emerald-900/30" : ""
                }`}
              >
                <div
                  className={`flex items-center ${
                    sidebarOpen ? "space-x-2" : ""
                  } truncate`}
                >
                  <MessageCircle className="h-5 w-4 text-emerald-400 shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm text-foreground truncate">
                      {chat.title}
                    </span>
                  )}
                </div>

                {sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
