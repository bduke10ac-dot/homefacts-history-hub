import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const Unauthorized = () => (
  <div className="flex min-h-screen items-center justify-center bg-background p-6">
    <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-semibold">You don't have access</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This page requires permissions your account doesn't currently have. If you believe this is a mistake,
        contact the property owner or your Orivaz administrator.
      </p>
      <Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
    </div>
  </div>
);

export default Unauthorized;
