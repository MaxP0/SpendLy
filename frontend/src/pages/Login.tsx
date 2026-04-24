import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_36%),linear-gradient(180deg,_#0b1020_0%,_#0f172a_100%)]">
        <Loader2 className="h-6 w-6 animate-spin text-white/90" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log in");
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_36%),linear-gradient(180deg,_#0b1020_0%,_#0f172a_100%)]">
      <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="hidden lg:block text-white space-y-6 pr-8">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm tracking-wide text-white/80">
            Spendly secure access
          </div>
          <h1 className="text-5xl font-semibold tracking-tight leading-tight">
            Keep your business finances moving.
          </h1>
          <p className="max-w-xl text-lg text-white/70">
            Sign in to review invoices, receipts, cash flow, and tax-ready insights from one place.
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Fast access
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Refresh tokens
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Dashboard ready
            </div>
          </div>
        </div>

        <Card className="border-white/10 bg-slate-950/70 text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-slate-300">
              Enter your email and password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-5" onSubmit={onSubmit}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="demo@spendly.test" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  Sign in
                </Button>
                <p className="text-sm text-slate-400 text-center">
                  New here? <Link to="/register" className="text-emerald-300 hover:text-emerald-200">Create an account</Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
