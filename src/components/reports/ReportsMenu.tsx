import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { FileText, ChevronDown } from "lucide-react";

const REPORTS = [
  { type: "buyer", label: "Buyer's Due-Diligence" },
  { type: "seller", label: "Seller's Disclosure" },
  { type: "insurance", label: "Insurance Underwriting" },
  { type: "roof", label: "Roof Condition" },
  { type: "maintenance", label: "Maintenance Plan" },
];

export function ReportsMenu({ propertyId, size = "sm" }: { propertyId: string; size?: "sm" | "default" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size}>
          <FileText className="mr-2 h-4 w-4" />AI reports<ChevronDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Generate AI report</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {REPORTS.map((r) => (
          <DropdownMenuItem key={r.type} asChild>
            <Link to={`/property/${propertyId}/report/${r.type}`}>{r.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
