import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

export function TOSAcceptanceAuditLog() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [acceptanceStatus, setAcceptanceStatus] = useState<"all" | "accepted" | "not_accepted">("all");

  const { data: auditData, isLoading, refetch } = trpc.admin.getTOSAcceptanceAuditLog.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    acceptanceStatus,
  });

  const handleExportCSV = () => {
    if (!auditData || auditData.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create CSV content
    const headers = ["User ID", "Name", "Email", "TOS Accepted At", "Privacy Policy Accepted At", "Account Created", "Last Sign In"];
    const rows = auditData.map((user) => [
      user.id,
      user.name || "N/A",
      user.email || "N/A",
      user.tosAcceptedAt ? new Date(user.tosAcceptedAt).toLocaleString() : "Not Accepted",
      user.privacyPolicyAcceptedAt ? new Date(user.privacyPolicyAcceptedAt).toLocaleString() : "Not Accepted",
      new Date(user.createdAt).toLocaleString(),
      new Date(user.lastSignedIn).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tos-acceptance-audit-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Audit log exported successfully");
  };

  const handleApplyFilters = () => {
    refetch();
  };

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setAcceptanceStatus("all");
    setTimeout(() => refetch(), 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              TOS/Privacy Policy Acceptance Audit Log
            </CardTitle>
            <CardDescription>
              Track user acceptance of Terms of Service and Privacy Policy for compliance reporting
            </CardDescription>
          </div>
          <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={!auditData || auditData.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acceptanceStatus">Acceptance Status</Label>
              <Select value={acceptanceStatus} onValueChange={(value: any) => setAcceptanceStatus(value)}>
                <SelectTrigger id="acceptanceStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="accepted">Accepted Only</SelectItem>
                  <SelectItem value="not_accepted">Not Accepted Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} size="sm">
              Apply Filters
            </Button>
            <Button onClick={handleResetFilters} variant="outline" size="sm">
              Reset
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {auditData && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Accepted</span>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-2">
                {auditData.filter((u) => u.tosAcceptedAt).length}
              </p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Not Accepted</span>
              </div>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-2">
                {auditData.filter((u) => !u.tosAcceptedAt).length}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <FileText className="h-5 w-5" />
                <span className="font-medium">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                {auditData.length}
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading audit data...</div>
          ) : !auditData || auditData.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No users found matching the selected filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>TOS Accepted</TableHead>
                  <TableHead>Privacy Policy Accepted</TableHead>
                  <TableHead>Account Created</TableHead>
                  <TableHead>Last Sign In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">{user.id}</TableCell>
                    <TableCell>{user.name || <span className="text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell>{user.email || <span className="text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell>
                      {user.tosAcceptedAt ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{new Date(user.tosAcceptedAt).toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-muted-foreground">Not Accepted</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.privacyPolicyAcceptedAt ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{new Date(user.privacyPolicyAcceptedAt).toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-muted-foreground">Not Accepted</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{new Date(user.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{new Date(user.lastSignedIn).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Compliance Note */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Compliance Note:</strong> This audit log provides a complete record of user acceptance of your Terms of Service and Privacy Policy. 
            Export this data regularly for compliance reporting and legal protection. Records show the exact timestamp when each user accepted your legal agreements.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
