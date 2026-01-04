import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, FileText, MapPin, CheckCircle2 } from "lucide-react";

interface VerificationRequiredProps {
  action: string;
  className?: string;
}

/**
 * Component shown when unverified users attempt restricted actions.
 * Explains KYC requirement and provides clear path to get verified.
 */
export function VerificationRequired({ action, className }: VerificationRequiredProps) {
  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className || ""}`}>
      <ShieldCheck className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-900 font-semibold mb-3">
        KYC Verification Required
      </AlertTitle>
      <AlertDescription className="space-y-4">
        <p className="text-amber-800">
          To {action}, you must complete our KYC (Know Your Customer) verification. This ensures trust and security for all marketplace participants in multi-million dollar transactions.
        </p>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-900">Verification includes:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-amber-800">
                <strong>Government ID:</strong> Passport, driver's license, or national ID card
              </span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-amber-800">
                <strong>Proof of Address:</strong> Utility bill or bank statement (within 3 months)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-amber-800">
                <strong>Admin Review:</strong> Manual review within 24-48 hours
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button asChild className="bg-amber-600 hover:bg-amber-700">
            <Link href="/verify-account">
              Complete Verification
            </Link>
          </Button>
        </div>

        <p className="text-xs text-amber-700">
          Verification protects both buyers and sellers from fraud.
        </p>
      </AlertDescription>
    </Alert>
  );
}
