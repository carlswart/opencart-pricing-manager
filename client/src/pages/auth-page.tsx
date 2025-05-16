import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation, serverRestarted } = useAuth();

  // Use an effect for redirection to avoid React hook rendering issues
  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      navigate("/");
    }
    
    // Show notification if server has restarted
    if (serverRestarted) {
      toast({
        title: "Session expired",
        description: "The server has restarted. Please log in again to continue.",
        variant: "destructive",
      });
    }
  }, [user, navigate, serverRestarted, toast]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(values);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Handle register form submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    try {
      await registerMutation.mutateAsync({
        ...values,
        role: "user",
      });
      toast({
        title: "Registration successful",
        description: "Your account has been created.",
      });
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-primary to-primary/70 p-8 text-primary-foreground flex flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-primary-foreground to-primary-foreground/80 bg-clip-text text-transparent">PriceSync</h1>
          <p className="text-xl mb-6">
            Manage product pricing across multiple OpenCart webstores from a
            single dashboard.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <span className="mr-2 text-lg bg-primary-foreground/20 rounded-full flex items-center justify-center h-6 w-6 text-primary-foreground">✓</span> 
              <span>Update pricing with spreadsheet uploads</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-lg bg-primary-foreground/20 rounded-full flex items-center justify-center h-6 w-6 text-primary-foreground">✓</span>
              <span>Automatic discount calculations</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-lg bg-primary-foreground/20 rounded-full flex items-center justify-center h-6 w-6 text-primary-foreground">✓</span>
              <span>Manage inventory levels</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-lg bg-primary-foreground/20 rounded-full flex items-center justify-center h-6 w-6 text-primary-foreground">✓</span>
              <span>Track update history</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Auth Forms */}
      <div className="flex-1 p-8 flex items-center justify-center bg-card">
        <Card className="w-full max-w-md border shadow-lg">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                  <CardContent className="space-y-4 pt-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                  <CardContent className="space-y-4 pt-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Choose a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}