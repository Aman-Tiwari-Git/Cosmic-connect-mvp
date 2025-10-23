import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Link } from "react-router-dom";
import { Sparkles, MessageCircle, Star, Zap } from "lucide-react";
import heroImage from "@/assets/hero-cosmic.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm animate-float">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium">Connect with Expert Astrologers</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Discover Your Cosmic
              </span>
              <br />
              <span className="text-foreground">Destiny</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get personalized astrology consultations from verified experts. Chat in real-time and unlock the secrets of the stars.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-glow"
                asChild
              >
                <Link to="/auth?mode=signup">
                  <MessageCircle className="mr-2 w-5 h-5" />
                  Start Free Consultation
                </Link>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/10"
                asChild
              >
                <Link to="/auth?mode=signup&role=astrologer">
                  <Sparkles className="mr-2 w-5 h-5" />
                  Join as Astrologer
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Why Choose AstroTalk?
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 hover:shadow-cosmic transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Expert Astrologers</h3>
              <p className="text-muted-foreground">
                Connect with verified and experienced astrologers who specialize in Vedic, Western, and Tarot readings.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 hover:shadow-cosmic transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-secondary to-accent rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Real-Time Chat</h3>
              <p className="text-muted-foreground">
                Get instant answers through our secure real-time chat system. Private, confidential, and convenient.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 hover:shadow-cosmic transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-background" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Affordable Rates</h3>
              <p className="text-muted-foreground">
                Pay only for the time you use. Transparent pricing with no hidden fees. Start from as low as ₹10/min.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm border border-primary/30 rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Unlock Your Cosmic Potential?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users who trust AstroTalk for their spiritual guidance.
            </p>
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all"
              asChild
            >
              <Link to="/auth?mode=signup">
                Get Started Now
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 AstroTalk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
