import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface Chat {
  id: string;
  is_active: boolean;
  user_id: string;
  astrologer_id: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

export default function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadChatData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(session.user.id);

      // Load chat details
      const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .select("*")
        .eq("id", chatId)
        .single();

      if (chatError || !chatData) {
        toast.error("Chat not found");
        navigate("/dashboard");
        return;
      }

      setChat(chatData);

      // Determine other user
      const otherId = chatData.user_id === session.user.id 
        ? chatData.astrologer_id 
        : chatData.user_id;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", otherId)
        .single();

      setOtherUser(profileData);

      // Load messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      setMessages(messagesData || []);
      setLoading(false);

      // Subscribe to new messages
      const channel = supabase
        .channel(`chat:${chatId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    loadChatData();
  }, [chatId, navigate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !chat || !chat.is_active) return;

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: currentUserId,
      message: newMessage.trim(),
    });

    if (error) {
      toast.error("Failed to send message");
      console.error(error);
    } else {
      setNewMessage("");
    }

    setSending(false);
  };

  const handlePaymentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chat) return;

    toast.info("Upload payment proof and contact admin for verification");
    
    // In a real implementation, you would upload to Supabase storage
    // and create a payment record
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 pt-20 pb-4 flex-1 flex flex-col">
        {/* Chat Header */}
        <Card className="mb-4 bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <Avatar className="w-12 h-12 border-2 border-primary">
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {otherUser?.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle>{otherUser?.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">{otherUser?.role}</p>
            </div>
            {chat?.is_active ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="border-accent/30 text-accent">
                Pending Payment
              </Badge>
            )}
          </CardHeader>
        </Card>

        {/* Payment Warning */}
        {!chat?.is_active && (
          <Card className="mb-4 bg-accent/10 border-accent/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Payment Verification Required</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Please upload your payment proof or contact admin to activate this chat session.
                  </p>
                  <Button variant="outline" className="border-accent/30" asChild>
                    <label>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Payment Proof
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePaymentUpload}
                      />
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages Area */}
        <Card className="flex-1 flex flex-col bg-card/80 backdrop-blur-sm">
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        isOwn
                          ? "bg-gradient-to-r from-primary to-secondary text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm break-words">{message.message}</p>
                      <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-muted-foreground"}`}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="border-t border-border p-4">
            <div className="flex gap-2">
              <Input
                placeholder={
                  chat?.is_active
                    ? "Type your message..."
                    : "Chat will be available after payment verification"
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={!chat?.is_active || sending}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!chat?.is_active || !newMessage.trim() || sending}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
