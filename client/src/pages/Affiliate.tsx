import { Check, DollarSign, Users, TrendingUp, Gift } from "lucide-react";
import { APP_TITLE } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";

export default function Affiliate() {
  const benefits = [
    {
      icon: DollarSign,
      title: "Generous Commission",
      description: "Earn 10% of the success fee when your referrals sell their iGaming business"
    },
    {
      icon: Users,
      title: "Lifetime Tracking",
      description: "Get credit for every referral, even if they list months after signing up"
    },
    {
      icon: TrendingUp,
      title: "Recurring Revenue",
      description: "Earn from premium listing upgrades and repeat sellers"
    },
    {
      icon: Gift,
      title: "Marketing Support",
      description: "Access banners, email templates, and co-marketing opportunities"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Join the Program",
      description: "Sign up for free and get your unique referral link"
    },
    {
      step: "2",
      title: "Share Your Link",
      description: "Promote " + APP_TITLE + " to iGaming business owners, brokers, and industry contacts"
    },
    {
      step: "3",
      title: "Earn Commission",
      description: "Get paid when your referrals successfully sell their business"
    }
  ];

  const idealFor = [
    "iGaming consultants and advisors",
    "Business brokers and M&A professionals",
    "Industry bloggers and content creators",
    "iGaming community leaders and event organizers",
    "Technology vendors serving the iGaming market",
    "Anyone with connections in the iGaming business industry"
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Earn While Helping iGaming Businesses Find Buyers
            </h1>
            <p className="text-xl text-primary-foreground/90 mb-8">
              Join our affiliate program and earn generous commissions by referring iGaming sellers to the marketplace
            </p>
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Join the Affiliate Program
            </Button>
            <p className="text-sm text-primary-foreground/80 mt-4">
              Coming Soon • Sign up to be notified when we launch
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Join Our Affiliate Program?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We offer one of the most competitive affiliate programs in the M&A marketplace space
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, idx) => (
            <Card key={idx} className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{benefit.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-muted/30 py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">
              Start earning in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ideal For */}
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ideal For</h2>
            <p className="text-muted-foreground text-lg">
              Our affiliate program is perfect for professionals and influencers in the iGaming business space
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {idealFor.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commission Example */}
      <div className="bg-primary/5 py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Commission Example</h2>
            <Card className="p-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-muted-foreground">Business Sale Price:</span>
                  <span className="font-bold">$2,000,000</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-muted-foreground">Platform Success Fee (3%):</span>
                  <span className="font-bold">$60,000</span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center text-xl">
                  <span className="font-semibold">Your Commission (10%):</span>
                  <span className="font-bold text-primary text-2xl">$6,000</span>
                </div>
              </div>
            </Card>
            <p className="text-muted-foreground mt-6">
              Plus ongoing commissions from premium listing upgrades and future transactions
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join our affiliate program and start earning commissions by helping iGaming business owners find the right buyers
          </p>
          <Button size="lg" className="text-lg px-8">
            Apply Now
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Program launching soon • Be the first to know
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
