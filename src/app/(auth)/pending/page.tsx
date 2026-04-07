import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function PendingPage() {
  return (
    <Card className="border-0 shadow-2xl text-center">
      <CardHeader>
        <div className="mx-auto mb-4 text-4xl font-bold text-srsf-green-500">
          SRSF
        </div>
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-srsf-purple-100 flex items-center justify-center">
          <Clock className="w-8 h-8 text-srsf-purple-600" />
        </div>
        <CardTitle className="text-xl">Account Pending Approval</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Your account is awaiting administrator approval. You&apos;ll receive
          an email once access has been granted.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          If you believe this is an error, please contact your system
          administrator.
        </p>
      </CardContent>
    </Card>
  );
}
