import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const Auth = () => {
  const [loginId, setLoginId] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("Welcome Back");
  const [step, setStep] = useState<"identity" | "totp">("identity");

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  // Fetch company logo and name from settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["auth_logo_url", "company_name"]);

      if (data) {
        data.forEach((setting) => {
          if (setting.key === "auth_logo_url" && setting.value) {
            setCompanyLogo(setting.value);
          }
          if (setting.key === "company_name" && setting.value) {
            setCompanyName(setting.value);
          }
        });
      }
    };
    fetchSettings();
  }, []);

  // Redirect logged-in users to appropriate panel
  useEffect(() => {
    if (user && !hasRedirected.current) {
      hasRedirected.current = true;
      const checkAndRedirect = async () => {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        const userRoles = roles?.map((r) => r.role) || [];
        const isAdminUser =
          userRoles.includes("admin") || userRoles.includes("super_admin");

        navigate(isAdminUser ? "/admin" : "/dashboard");
      };
      checkAndRedirect();
    }
  }, [user, navigate]);

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim()) return;
    setStep("totp");
  };

  const handleTotpSubmit = async () => {
    if (totpCode.length !== 6) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-totp", {
        body: { login_id: loginId.trim(), totp_code: totpCode },
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: "Unable to verify. Please try again.",
          variant: "destructive",
        });
        setTotpCode("");
        setIsLoading(false);
        return;
      }

      if (data?.error) {
        toast({
          title: "Login Failed",
          description: data.error,
          variant: "destructive",
        });
        setTotpCode("");
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        // Set the session from the edge function response
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });

        // Redirect based on role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id);

        const userRoles = roles?.map((r) => r.role) || [];
        const isAdminUser =
          userRoles.includes("admin") || userRoles.includes("super_admin");

        navigate(isAdminUser ? "/admin" : "/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (totpCode.length === 6 && step === "totp") {
      handleTotpSubmit();
    }
  }, [totpCode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
          <div className="text-center mb-8">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="Company Logo"
                className="h-16 w-auto mx-auto mb-4 object-contain"
              />
            ) : null}
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {companyName}
            </h1>
            <p className="text-muted-foreground">
              {step === "identity"
                ? "Sign in to access your account"
                : "Enter your Google Authenticator code"}
            </p>
          </div>

          {step === "identity" ? (
            <form onSubmit={handleIdentitySubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username or Email
                </label>
                <Input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Enter username or email"
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Signing in as <span className="font-medium text-foreground">{loginId}</span>
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <label className="block text-sm font-medium text-foreground">
                  6-Digit Authenticator Code
                </label>
                <InputOTP
                  maxLength={6}
                  value={totpCode}
                  onChange={(value) => setTotpCode(value)}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <span className="text-2xl text-muted-foreground">-</span>
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleTotpSubmit}
                className="w-full"
                disabled={isLoading || totpCode.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("identity");
                  setTotpCode("");
                }}
              >
                ← Use different account
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need an account? Contact your administrator.
            </p>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
