import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Save, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface AstrologerProfile {
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
}

interface Chat {
  id: string;
  is_active: boolean;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export default function AstrologerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<AstrologerProfile | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      // Check if user is astrologer
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (userProfile?.role !== "astrologer") {
        navigate("/dashboard");
        return;
      }

      // Load astrologer profile
      const { data: astroData, error: astroError } = await supabase
        .from("astrologers")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (astroError && astroError.code === "PGRST116") {
        // Profile doesn't exist, create default
        const defaultProfile = {
          id: session.user.id,
          bio: "",
          expertise: [],
          specialties: "",
          experience_years: 0,
          rate_per_minute: 10,
          is_online: false,
          rating: 0,
          total_consultations: 0,
          languages: ["English"],
        };

        const { error: insertError } = await supabase
          .from("astrologers")
          .insert(defaultProfile);

        if (!insertError) {
          setProfile(defaultProfile);
        }
      } else if (astroData) {
        setProfile(astroData);
      }

      // Load active chats
      const { data: chatData } = await supabase
        .from("chats")
        .select(`
          id,
          is_active,
          created_at,
          profiles!chats_user_id_fkey (
            full_name
          )
        `)
        .eq("astrologer_id", session.user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setChats(chatData || []);
      setLoading(false);
    };

    loadData();
  }, [navigate]);

  const handleSaveProfile = async () => {
    if (!profile || !userId) return;

    setSaving(true);

    const { error } = await supabase
      .from("astrologers")
      .upsert({
        ...profile,
        id: userId,
      });

    if (error) {
      toast.error("Failed to save profile");
      console.error(error);
    } else {
      toast.success("Profile updated successfully");
    }

    setSaving(false);
  };

  const handleToggleOnline = async () => {
    if (!profile) return;

    const newStatus = !profile.is_online;
    
    const { error } = await supabase
      .from("astrologers")
      .update({ is_online: newStatus })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      setProfile({ ...profile, is_online: newStatus });
      toast.success(newStatus ? "You are now online" : "You are now offline");
    }
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Astrologer Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your profile and consultations</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {profile?.is_online ? "Online" : "Offline"}
            </span>
            <Switch
              checked={profile?.is_online}
              onCheckedChange={handleToggleOnline}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="lg:col-span-3 grid md:grid-cols-3 gap-4">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Consultations</p>
                    <p className="text-3xl font-bold text-primary">
                      {profile?.total_consultations || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="text-3xl font-bold text-accent">
                      {profile?.rating.toFixed(1) || "0.0"}
                    </p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-accent/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rate/min</p>
                    <p className="text-3xl font-bold text-secondary">
                      ₹{profile?.rate_per_minute || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Editor */}
          <Card className="lg:col-span-2 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  placeholder="Tell users about yourself..."
                  value={profile?.bio || ""}
                  onChange={(e) => setProfile(profile ? { ...profile, bio: e.target.value } : null)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Specialties</Label>
                <Input
                  placeholder="e.g., Love, Career, Health"
                  value={profile?.specialties || ""}
                  onChange={(e) => setProfile(profile ? { ...profile, specialties: e.target.value } : null)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    min="0"
                    value={profile?.experience_years || 0}
                    onChange={(e) => setProfile(profile ? { ...profile, experience_years: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rate per Minute (₹)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={profile?.rate_per_minute || 10}
                    onChange={(e) => setProfile(profile ? { ...profile, rate_per_minute: parseInt(e.target.value) || 10 } : null)}
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Profile
              </Button>
            </CardContent>
          </Card>

          {/* Active Chats */}
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Active Chats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {chats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active chats
                </p>
              ) : (
                chats.map((chat) => (
                  <Button
                    key={chat.id}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => navigate(`/chat/${chat.id}`)}
                  >
                    <span className="truncate">{chat.profiles.full_name}</span>
                    <Badge variant="outline" className="ml-2">
                      Active
                    </Badge>
                  </Button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
