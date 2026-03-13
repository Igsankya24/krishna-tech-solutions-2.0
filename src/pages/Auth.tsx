import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type AuthStep = "identity" | "password" | "totp";

const Auth = () => {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("Welcome Back");
  const [step, setStep] = useState<AuthStep>("identity");
  const [userNotFound, setUserNotFound] = useState(false);

  const { user, signIn, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["auth_logo_url", "company_name"]);
      if (data) {
        data.forEach((s) => {
          if (s.key === "auth_logo_url" && s.value) setCompanyLogo(s.value);
          if (s.key === "company_name" && s.value) setCompanyName(s.value);
        });
      }
    };
    fetchSettings();
  }, []);

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

  // Auto-check user existence on typing
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
        if (data.auth_method === "authenticator") {
          if (!data.totp_enabled) {
            toast({
              title: "Authenticator Not Set Up",
              description: "Contact your administrator to set up Google Authenticator.",
              variant: "destructive",
            });
            setIsChecking(false);
            return;
          }
          setStep("totp");
        } else {
          setStep("password");
        }
      }
    } catch {
      setUserNotFound(true);
    }
    setIsChecking(false);
  }, [toast]);

  const handleLoginIdChange = (value: string) => {
    setLoginId(value);
    setUserNotFound(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 3) {
      debounceRef.current = setTimeout(() => checkUser(value), 800);
    }
  };

  // Password login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsLoading(true);

    try {
      const rawLoginId = loginId.trim();
      let email = rawLoginId;

      if (!rawLoginId.includes("@")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .ilike("username", rawLoginId)
          .maybeSingle();
        if (!profile?.email) {
          toast({ title: "Login Failed", description: "Username not found", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        email = profile.email;
      }

      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Login Failed", description: "Invalid password", variant: "destructive" });
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          // Check frozen
          const { data: profileData } = await supabase
            .from("profiles")
            .select("is_frozen")
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if ((profileData as any)?.is_frozen) {
            await signOut();
            toast({ title: "Account Frozen", description: "Contact admin for assistance.", variant: "destructive" });
            setIsLoading(false);
            return;
          }

          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id);
          const userRoles = roles?.map((r) => r.role) || [];
          const isAdminUser = userRoles.includes("admin") || userRoles.includes("super_admin");

          toast({ title: "Welcome back!", description: "You have successfully logged in." });
          navigate(isAdminUser ? "/admin" : "/dashboard");
        }
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // TOTP login
  const handleTotpSubmit = useCallback(async () => {
    if (totpCode.length !== 6 || isLoading) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-totp", {
        body: { login_id: loginId.trim(), totp_code: totpCode },
      });

      if (error || data?.error) {
        toast({ title: "Login Failed", description: data?.error || "Invalid code.", variant: "destructive" });
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

  useEffect(() => {
    if (totpCode.length === 6 && step === "totp") {
      handleTotpSubmit();
    }
  }, [totpCode, step, handleTotpSubmit]);

  const goBack = () => {
    setStep("identity");
    setTotpCode("");
    setPassword("");
    setLoginId("");
    setUserNotFound(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
          <div className="text-center mb-8">
            {companyLogo && (
              <img src={companyLogo} alt="Company Logo" className="h-16 w-auto mx-auto mb-4 object-contain" />
            )}
            <h1 className="text-2xl font-bold text-foreground mb-2">{companyName}</h1>
            <p className="text-muted-foreground">
              {step === "identity" && "Enter your username or email to sign in"}
              {step === "password" && "Enter your password"}
              {step === "totp" && "Enter your Google Authenticator code"}
            </p>
          </div>

          {step === "identity" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Username or Email</label>
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
                  <p className="text-xs text-destructive mt-1.5">Account not found.</p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  You'll be redirected automatically once found
                </p>
              </div>
            </div>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Signing in as <span className="font-medium text-foreground">{loginId}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoFocus
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <Button variant="ghost" className="w-full" onClick={goBack} type="button">
                ← Use different account
              </Button>
            </form>
          )}

          {step === "totp" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Signing in as <span className="font-medium text-foreground">{loginId}</span>
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <label className="block text-sm font-medium text-foreground">6-Digit Authenticator Code</label>
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

              <Button variant="ghost" className="w-full" onClick={goBack}>
                ← Use different account
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">Need an account? Contact your administrator.</p>
          </div>
          <div className="mt-4 text-center">
            <a href="/" className="text-muted-foreground hover:text-foreground text-sm">← Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
