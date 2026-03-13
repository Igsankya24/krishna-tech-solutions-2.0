import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2 } from "lucide-react";
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
  const [isChecking, setIsChecking] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("Welcome Back");
  const [step, setStep] = useState<"identity" | "totp">("identity");
  const [userNotFound, setUserNotFound] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch company logo and name
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["auth_logo_url", "company_name"]);

      if (data) {
        data.forEach((setting) => {
          if (setting.key === "auth_logo_url" && setting.value) setCompanyLogo(setting.value);
          if (setting.key === "company_name" && setting.value) setCompanyName(setting.value);
        });
      }
    };
    fetchSettings();
  }, []);

  // Redirect logged-in users
  useEffect(() => {
    if (user && !hasRedirected.current) {
      hasRedirected.current = true;
      const checkAndRedirect = async () => {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        const userRoles = roles?.map((r) => r.role) || [];
        const isAdminUser = userRoles.includes("admin") || userRoles.includes("super_admin");
        navigate(isAdminUser ? "/admin" : "/dashboard");
      };
      checkAndRedirect();
    }
  }, [user, navigate]);

  // Auto-check user when they stop typing (debounced)
  const checkUser = useCallback(async (value: string) => {
    if (!value.trim() || value.trim().length < 3) {
      setUserNotFound(false);
      return;
    }

    setIsChecking(true);
    setUserNotFound(false);

    try {
      const { data, error } = await supabase.functions.invoke("check-user", {
        body: { login_id: value.trim() },
      });

      if (error || !data?.exists) {
        setUserNotFound(true);
        setIsChecking(false);
        return;
      }

      if (data.exists) {
        if (!data.totp_enabled) {
          toast({
            title: "Authenticator Not Set Up",
            description: "Contact your administrator to set up Google Authenticator.",
            variant: "destructive",
          });
          setIsChecking(false);
          return;
        }
        // User found & TOTP enabled → go to PIN page
        setStep("totp");
      }
    } catch {
      setUserNotFound(true);
    }
    setIsChecking(false);
  }, [toast]);

  const handleLoginIdChange = (value: string) => {
    setLoginId(value);
    setUserNotFound(false);

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Debounce: check after 800ms of no typing
    if (value.trim().length >= 3) {
      debounceRef.current = setTimeout(() => {
        checkUser(value);
      }, 800);
    }
  };

  const handleTotpSubmit = useCallback(async () => {
    if (totpCode.length !== 6 || isLoading) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-totp", {
        body: { login_id: loginId.trim(), totp_code: totpCode },
      });

      if (error || data?.error) {
        toast({
          title: "Login Failed",
          description: data?.error || "Unable to verify. Please try again.",
          variant: "destructive",
        });
        setTotpCode("");
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        toast({ title: "Welcome back!", description: "You have successfully logged in." });

        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id);

        const userRoles = roles?.map((r) => r.role) || [];
        const isAdminUser = userRoles.includes("admin") || userRoles.includes("super_admin");
        navigate(isAdminUser ? "/admin" : "/dashboard");
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [totpCode, loginId, isLoading, toast, navigate]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (totpCode.length === 6 && step === "totp") {
      handleTotpSubmit();
    }
  }, [totpCode, step, handleTotpSubmit]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
          <div className="text-center mb-8">
            {companyLogo && (
              <img
                src={companyLogo}
                alt="Company Logo"
                className="h-16 w-auto mx-auto mb-4 object-contain"
              />
            )}
            <h1 className="text-2xl font-bold text-foreground mb-2">{companyName}</h1>
            <p className="text-muted-foreground">
              {step === "identity"
                ? "Enter your username or email to sign in"
                : "Enter your Google Authenticator code"}
            </p>
          </div>

          {step === "identity" ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={loginId}
                    onChange={(e) => handleLoginIdChange(e.target.value)}
                    placeholder="Enter username or email"
                    autoFocus
                    className={userNotFound ? "border-destructive" : ""}
                  />
                  {isChecking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                {userNotFound && loginId.trim().length >= 3 && (
                  <p className="text-xs text-destructive mt-1.5">
                    Account not found. Check your username or email.
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  You'll be redirected to enter your authenticator PIN automatically
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Signing in as{" "}
                  <span className="font-medium text-foreground">{loginId}</span>
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
                  autoFocus
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

                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("identity");
                  setTotpCode("");
                  setLoginId("");
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

          <div className="mt-4 text-center">
            <a href="/" className="text-muted-foreground hover:text-foreground text-sm">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
