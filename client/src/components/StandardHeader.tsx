import { Building2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE, getLoginUrl } from "@/const";

/**
 * Standardized header component with consistent navigation across all pages
 * Navigation: Buy | Browse | Sell | Valuate | Admin (if admin)
 */
export function StandardHeader() {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">{APP_TITLE}</span>
          </div>
        </Link>
        
        {/* Main Navigation - Center */}
        <nav className="flex items-center gap-8">
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
          {user?.role === "admin" && (
            <Link href="/admin-dashboard" className="text-foreground hover:text-primary font-medium transition-colors">
              Admin
            </Link>
          )}
        </nav>
        
        {/* Login/Dashboard Button - Right */}
        <div>
          {isAuthenticated ? (
            <Link href="/buyer-dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button>Login</Button>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
