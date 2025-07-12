import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Rocket, ArrowLeft, Github, Mail } from 'lucide-react'

interface AuthPageProps {
  type: 'login' | 'signup'
}

export function AuthPage({ type }: AuthPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call - replace with actual auth logic later
    setTimeout(() => {
      setIsLoading(false)
      navigate('/dashboard')
    }, 1500)
  }

  const isLogin = type === 'login'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to PromptPilot
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? 'Sign in to your PromptPilot account' 
                  : 'Start building apps with AI today'
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full" disabled={isLoading}>
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
                <Button variant="outline" className="w-full" disabled={isLoading}>
                  <Mail className="w-4 h-4 mr-2" />
                  Google
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                      disabled={isLoading}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {isLogin && (
                  <div className="text-right">
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </div>
                  ) : (
                    isLogin ? 'Sign in' : 'Create account'
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter>
              <p className="text-sm text-center text-muted-foreground w-full">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Link 
                  to={isLogin ? "/signup" : "/login"} 
                  className="text-blue-500 hover:text-blue-600 transition-colors font-medium"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </Link>
              </p>
            </CardFooter>
          </Card>

          {!isLogin && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-blue-500 hover:text-blue-600">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-blue-500 hover:text-blue-600">Privacy Policy</Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}