import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useSiteLogo } from "@/hooks/useSiteLogo";
import { Building2, Menu, MessageSquare, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { UserDropdown } from "@/components/UserDropdown";
import { NotificationBell } from "@/components/NotificationBell";

export function PublicHeader() {
  const { user, isAuthenticated } = useAuth();
  const logoUrl = useSiteLogo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: unreadData } = trpc.dealMessage.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });
  const unreadCount = unreadData?.count ?? 0;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            {logoUrl ? (
              <img src={logoUrl} alt={APP_TITLE} className="h-8 w-auto" />
            ) : (
              <Building2 className="h-6 w-6 text-primary" />
            )}
            <span className="font-bold text-xl">{APP_TITLE}</span>
          </div>
        </Link>
        
        {/* Main Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/buy-asset" className="text-foreground hover:text-primary font-medium transition-colors">
            Buy
          </Link>
          <Link href="/marketplace" className="text-foreground hover:text-primary font-medium transition-colors">
            Browse
          </Link>
          <Link href="/create-listing" className="text-foreground hover:text-primary font-medium transition-colors">
            Sell
          </Link>
          <Link href="/valuation-tool" className="text-foreground hover:text-primary font-medium transition-colors">
            Valuate
          </Link>
          {isAuthenticated && (
            <Link href="/messages" className="relative flex items-center gap-1.5 text-foreground hover:text-primary font-medium transition-colors">
              <MessageSquare className="h-4 w-4" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-3 rounded-full h-4 w-4 flex items-center justify-center p-0 text-[10px] leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin-dashboard" className="text-foreground hover:text-primary font-medium transition-colors">
              Admin
            </Link>
          )}
        </nav>
        
        {/* Right Side - Desktop Login + Mobile Menu Button */}
        <div className="flex items-center gap-4">
          {/* Desktop User Controls */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <NotificationBell />
                <UserDropdown user={user} />
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default">Login</Button>
              </a>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-accent rounded-md transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu */}
          <div className="fixed top-16 left-0 right-0 bg-background border-b shadow-lg z-50 md:hidden">
            <nav className="container py-4 flex flex-col gap-4">
              <Link 
                href="/buy-asset" 
                className="text-foreground hover:text-primary font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Buy
              </Link>
              <Link 
                href="/marketplace" 
                className="text-foreground hover:text-primary font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse
              </Link>
              <Link 
                href="/create-listing" 
                className="text-foreground hover:text-primary font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sell
              </Link>
              <Link
                href="/valuation-tool"
                className="text-foreground hover:text-primary font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Valuate
              </Link>
              {isAuthenticated && (
                <Link
                  href="/messages"
                  className="flex items-center gap-2 text-foreground hover:text-primary font-medium transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Messages
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="rounded-full h-5 min-w-5 flex items-center justify-center px-1 text-xs">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Link>
              )}
              {user?.role === "admin" && (
                <Link 
                  href="/admin-dashboard" 
                  className="text-foreground hover:text-primary font-medium transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              
              {/* Mobile User Controls */}
              <div className="pt-4 border-t">
                {isAuthenticated && user ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Signed in as {user.email}</span>
                      <NotificationBell />
                    </div>
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">Profile</Button>
                    </Link>
                    <Link href="/my-listings" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">My Listings</Button>
                    </Link>
                    <Link href="/my-deals" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">My Deals</Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        // Trigger logout
                        window.location.href = '/api/auth/logout';
                      }}
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button variant="default" className="w-full">Login</Button>
                  </a>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}

export default PublicHeader;
