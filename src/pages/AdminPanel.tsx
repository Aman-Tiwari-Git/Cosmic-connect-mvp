import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Payment {
  id: string;
  amount: number;
  status: string;
  proof_url: string;
  created_at: string;
  chat_id: string;
  profiles: {
    full_name: string;
  };
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "admin") {
        toast.error("Unauthorized access");
        navigate("/dashboard");
        return;
      }

      // Load pending payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select(`
          *,
          profiles!payments_user_id_fkey (
            full_name
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      setPayments(paymentsData || []);
      setLoading(false);
    };

    loadData();
  }, [navigate]);

  const handleVerifyPayment = async (paymentId: string, chatId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Update payment status
    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        status: "verified",
        verified_by: session.user.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (paymentError) {
      toast.error("Failed to verify payment");
      return;
    }

    // Activate chat
    const { error: chatError } = await supabase
      .from("chats")
      .update({ is_active: true })
      .eq("id", chatId);

    if (chatError) {
      toast.error("Failed to activate chat");
      return;
    }

    toast.success("Payment verified and chat activated");
    
    // Remove from list
    setPayments(payments.filter((p) => p.id !== paymentId));
  };

  const handleRejectPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from("payments")
      .update({ status: "rejected" })
      .eq("id", paymentId);

    if (error) {
      toast.error("Failed to reject payment");
      return;
    }

    toast.success("Payment rejected");
    setPayments(payments.filter((p) => p.id !== paymentId));
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
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage payment verifications</p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Pending Payment Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No pending payments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <Card key={payment.id} className="bg-muted/30">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {payment.profiles.full_name}
                            </span>
                            <Badge variant="outline">
                              {formatDistanceToNow(new Date(payment.created_at), {
                                addSuffix: true,
                              })}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Amount: ₹{payment.amount}</span>
                            {payment.proof_url && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0"
                                asChild
                              >
                                <a
                                  href={payment.proof_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View Proof
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30"
                            onClick={() =>
                              handleVerifyPayment(payment.id, payment.chat_id)
                            }
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectPayment(payment.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
