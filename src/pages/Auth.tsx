import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2, Eye, EyeOff, ArrowLeft, Monitor } from "lucide-react";
import { supabase } from "@/services/database";
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
        if (userRoles.includes("super_admin")) {
          navigate("/super-admin");
        } else if (userRoles.includes("admin")) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      };
      checkAndRedirect();
    }
  }, [user, navigate]);

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

          toast({ title: "Welcome back!", description: "You have successfully logged in." });
          if (userRoles.includes("super_admin")) {
            navigate("/super-admin");
          } else if (userRoles.includes("admin")) {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
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
        if (userRoles.includes("super_admin")) {
          navigate("/super-admin");
        } else if (userRoles.includes("admin")) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
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
    <div className="min-h-screen hero-section relative overflow-hidden flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-primary/[0.06] rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] right-[15%] w-[300px] h-[300px] bg-accent/[0.05] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Card */}
        <div className="bg-card/90 backdrop-blur-xl rounded-2xl p-8 md:p-10 border border-border/50 shadow-xl">
          {/* Logo area */}
          <div className="text-center mb-8">
            {companyLogo ? (
              <img src={companyLogo} alt="Company Logo" className="h-14 w-auto mx-auto mb-5 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-5">
                <Monitor className="w-6 h-6 text-primary-foreground" />
              </div>
            )}
            <h1 className="text-xl font-bold text-foreground font-display">{companyName}</h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              {step === "identity" && "Enter your username or email to sign in"}
              {step === "password" && "Enter your password to continue"}
              {step === "totp" && "Enter your authenticator code"}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center mb-8">
            {["identity", "password"].map((s, idx) => (
              <div key={s} className={`h-1 rounded-full transition-all duration-300 ${
                step === s || (step === "totp" && idx === 1) ? "w-8 bg-primary" : step === "password" && idx === 0 ? "w-8 bg-primary/40" : "w-4 bg-border"
              }`} />
            ))}
          </div>

          {step === "identity" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-foreground mb-2 uppercase tracking-wider">Username or Email</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={loginId}
                    onChange={(e) => handleLoginIdChange(e.target.value)}
                    placeholder="Enter username or email"
                    autoFocus
                    className={`h-11 ${userNotFound ? "border-destructive focus:ring-destructive" : ""}`}
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
                <p className="text-xs text-muted-foreground mt-2">
                  You'll be redirected automatically once found
                </p>
              </div>
            </div>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="flex items-center gap-2.5 p-3 bg-muted/50 rounded-xl border border-border/50">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Signing in as <span className="font-medium text-foreground">{loginId}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-2 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoFocus
                    minLength={6}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in...</> : "Sign In"}
              </Button>

              <button type="button" onClick={goBack} className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                Use different account
              </button>
            </form>
          )}

          {step === "totp" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 p-3 bg-muted/50 rounded-xl border border-border/50">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Signing in as <span className="font-medium text-foreground">{loginId}</span>
                </p>
              </div>

              <div className="flex flex-col items-center gap-5">
                <label className="block text-xs font-medium text-foreground uppercase tracking-wider">6-Digit Code</label>
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

              <button type="button" onClick={goBack} className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                Use different account
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">Need an account? Contact your administrator.</p>
          </div>
          <div className="mt-3 text-center">
            <a href="/" className="text-muted-foreground hover:text-foreground text-xs transition-colors inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
