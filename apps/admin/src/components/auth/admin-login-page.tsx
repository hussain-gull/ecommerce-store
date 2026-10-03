import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { branding } from "@ecommerce/contracts";

export function AdminLoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <img
              src={branding.logo}
              alt={branding.displayName}
              className="h-6 w-auto"
            />
            <span className="text-base font-semibold">
              {branding.displayName}
            </span>
          </div>
          <CardTitle>Admin sign in</CardTitle>
          <CardDescription>
            Sign in with your admin credentials to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
