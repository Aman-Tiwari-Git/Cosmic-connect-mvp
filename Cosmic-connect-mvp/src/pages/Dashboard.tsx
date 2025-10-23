import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, MessageCircle, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Astrologer {
  id: string;
  bio: string;
  expertise: string[];
  specialties: string;
  experience_years: number;
  rate_per_minute: number;
  is_online: boolean;
  rating: number;
  total_consultations: number;
  languages: string[];
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get user profile and role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);
        
        if (profile.role === "astrologer") {
          navigate("/astrologer-dashboard");
          return;
        }
      }

      // Load astrologers
      const { data, error } = await supabase
        .from("astrologers")
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .order("is_online", { ascending: false });

      if (error) {
        toast.error("Failed to load astrologers");
        console.error(error);
      } else {
        setAstrologers(data || []);
      }

      setLoading(false);
    };

    checkAuthAndLoadData();
  }, [navigate]);

  const handleStartChat = async (astrologerId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Create new chat
    const { data: chat, error } = await supabase
      .from("chats")
      .insert({
        user_id: session.user.id,
        astrologer_id: astrologerId,
        is_active: false, // Will be activated after payment verification
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to initiate chat");
      console.error(error);
      return;
    }

    navigate(`/chat/${chat.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <Navbar />

      <div className="container mx-auto px-4 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Connect with Expert Astrologers
          </h1>
          <p className="text-muted-foreground">
            Choose an astrologer and start your personalized consultation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {astrologers.map((astrologer) => (
            <Card
              key={astrologer.id}
              className="bg-card/80 backdrop-blur-sm border-border hover:shadow-cosmic transition-all hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16 border-2 border-primary">
                    <AvatarImage src={astrologer.profiles.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {astrologer.profiles.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <CardTitle className="text-xl">
                        {astrologer.profiles.full_name}
                      </CardTitle>
                      {astrologer.is_online && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Online
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span>{astrologer.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{astrologer.total_consultations} consultations</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-2">
                  {astrologer.bio || "Experienced astrologer ready to guide you"}
                </CardDescription>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{astrologer.experience_years}+ years experience</span>
                  </div>
                  
                  {astrologer.expertise && astrologer.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {astrologer.expertise.slice(0, 3).map((exp, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-border">
                  <div>
                    <span className="text-2xl font-bold text-accent">
                      ₹{astrologer.rate_per_minute}
                    </span>
                    <span className="text-sm text-muted-foreground">/min</span>
                  </div>

                  <Button
                    onClick={() => handleStartChat(astrologer.id)}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {astrologers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No astrologers available at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
