import { Mail, MessageSquare, HelpCircle, FileText } from "lucide-react";
import { APP_TITLE } from "@/const";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email within 24-48 hours",
      action: "support@msp.investments",
      link: "mailto:support@msp.investments"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with our team during business hours",
      action: "Start Chat",
      link: "#",
      comingSoon: true
    },
    {
      icon: HelpCircle,
      title: "FAQ",
      description: "Find answers to common questions",
      action: "View FAQ",
      link: "/faq"
    },
    {
      icon: FileText,
      title: "Documentation",
      description: "Learn how to use the platform",
      action: "View Guides",
      link: "/how-it-works"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission via tRPC
    toast.info("Contact form coming soon. Please email support@msp.investments directly.");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-primary-foreground/90">
              Have questions? We're here to help. Reach out through any of the channels below.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactMethods.map((method, idx) => (
            <Card key={idx} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <method.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{method.title}</CardTitle>
                <CardDescription>{method.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {method.comingSoon ? (
                  <Button variant="outline" disabled className="w-full">
                    Coming Soon
                  </Button>
                ) : method.link.startsWith('mailto:') ? (
                  <a href={method.link} className="text-primary hover:underline font-medium">
                    {method.action}
                  </a>
                ) : (
                  <Button variant="outline" asChild className="w-full">
                    <a href={method.link}>{method.action}</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Send Us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24-48 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What is this regarding?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Send Message
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  For urgent matters, please email us directly at{" "}
                  <a href="mailto:support@msp.investments" className="text-primary hover:underline">
                    support@msp.investments
                  </a>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Business Hours */}
        <div className="max-w-2xl mx-auto mt-12">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle>Support Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monday - Friday:</span>
                <span className="font-medium">9:00 AM - 6:00 PM EST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saturday - Sunday:</span>
                <span className="font-medium">Closed</span>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                We typically respond to all inquiries within 24-48 business hours.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
