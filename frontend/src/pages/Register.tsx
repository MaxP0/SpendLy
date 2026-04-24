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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import type { RegisterRequest, UserRole } from "@/types/api";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long and include at least one letter and one digit")
  .regex(/[A-Za-z]/, "Password must be at least 8 characters long and include at least one letter and one digit")
  .regex(/\d/, "Password must be at least 8 characters long and include at least one letter and one digit");

const registerSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
    role: z.enum(["self_employed_vat", "self_employed_no_vat", "paye_side_income"]),
    business_name: z.string().optional(),
    business_address: z.string().optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "self_employed_vat", label: "Self-employed (VAT registered)" },
  { value: "self_employed_no_vat", label: "Self-employed (not VAT registered)" },
  { value: "paye_side_income", label: "PAYE with side income" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading } = useAuth();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: "self_employed_vat",
      business_name: "",
      business_address: "",
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
      const payload: RegisterRequest = {
        email: values.email,
        password: values.password,
        role: values.role,
        business_name: values.business_name?.trim() || null,
        business_address: values.business_address?.trim() || null,
      };
      await register(payload);
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to register");
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_36%),linear-gradient(180deg,_#0b1020_0%,_#0f172a_100%)]">
      <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-[0.95fr_1.05fr] items-center">
        <Card className="border-white/10 bg-slate-950/70 text-white shadow-2xl shadow-black/30 backdrop-blur-xl order-2 lg:order-1">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl tracking-tight">Create your account</CardTitle>
            <CardDescription className="text-slate-300">
              Set up your demo profile and get started in under a minute.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-4" onSubmit={onSubmit}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" {...field} />
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
                        <Input type="password" placeholder="At least 8 chars, 1 letter and 1 digit" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Confirm password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Repeat your password" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Business name</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Maks Consulting" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Business address</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="12 Grafton St, Dublin 2" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  Create account
                </Button>

                <p className="text-sm text-slate-400 text-center">
                  Already have an account? <Link to="/login" className="text-emerald-300 hover:text-emerald-200">Sign in</Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="hidden lg:block text-white space-y-6 pl-8 order-1 lg:order-2">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm tracking-wide text-white/80">
            Spendly demo workspace
          </div>
          <h1 className="text-5xl font-semibold tracking-tight leading-tight">
            One account for invoices, expenses, and VAT.
          </h1>
          <p className="max-w-xl text-lg text-white/70">
            Register once and the dashboard becomes available immediately with protected access, refresh tokens, and authenticated profile loading.
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Secure JWT flow
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Demo-friendly defaults
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Fast onboarding
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
