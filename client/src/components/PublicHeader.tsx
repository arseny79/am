import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useSiteLogo } from "@/hooks/useSiteLogo";
import { AMLogo } from "@/components/AMLogo";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { UserDropdown } from "@/components/UserDropdown";
import { NotificationBell } from "@/components/NotificationBell";

const ADMIN_ROLES = ['admin', 'superadmin', 'sales', 'support'] as const;

export function PublicHeader() {
  const { user, isAuthenticated } = useAuth();
  const logoUrl = useSiteLogo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            {logoUrl ? (
              <img src={logoUrl} alt={APP_TITLE} className="h-8 w-auto" />
            ) : (
              <AMLogo size={32} />
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
          {user?.role && (ADMIN_ROLES as readonly string[]).includes(user.role) && (
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
              {user?.role && (ADMIN_ROLES as readonly string[]).includes(user.role) && (
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
