import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Rocket, 
  User, 
  Key, 
  Bell, 
  CreditCard, 
  Moon, 
  Sun, 
  Monitor,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Brain
} from 'lucide-react'
import { 
  getGeminiApiKey, 
  saveGeminiApiKey, 
  removeGeminiApiKey, 
  testGeminiApiKey, 
  isValidGeminiApiKey 
} from '@/services/geminiService'

export function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [name, setName] = useState('John Doe')
  const [email, setEmail] = useState('john@example.com')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [apiKey, setApiKey] = useState('sk-1234567890abcdef')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [isTestingGemini, setIsTestingGemini] = useState(false)
  const [geminiTestResult, setGeminiTestResult] = useState<{ valid: boolean; error?: string } | null>(null)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: true
  })

  // Load existing Gemini API key on component mount
  useEffect(() => {
    const existingKey = getGeminiApiKey()
    if (existingKey) {
      setGeminiApiKey(existingKey)
    }
  }, [])

  const handleSaveGeminiKey = async () => {
    if (!geminiApiKey.trim()) {
      removeGeminiApiKey()
      setGeminiTestResult(null)
      return
    }

    if (!isValidGeminiApiKey(geminiApiKey)) {
      setGeminiTestResult({ 
        valid: false, 
        error: 'Invalid API key format. Please check your Gemini API key from Google AI Studio.' 
      })
      return
    }

    setIsTestingGemini(true)
    setGeminiTestResult(null)

    try {
      const testResult = await testGeminiApiKey(geminiApiKey)
      setGeminiTestResult(testResult)
      
      if (testResult.valid) {
        saveGeminiApiKey(geminiApiKey)
      }
    } catch (error) {
      setGeminiTestResult({ 
        valid: false, 
        error: error instanceof Error ? error.message : 'Failed to test API key' 
      })
    } finally {
      setIsTestingGemini(false)
    }
  }

  const handleRemoveGeminiKey = () => {
    removeGeminiApiKey()
    setGeminiApiKey('')
    setGeminiTestResult(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/20">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                PromptPilot
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center">
                <Key className="w-4 h-4 mr-2" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Billing
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account profile information and email address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline">Change Avatar</Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        JPG, GIF or PNG. 1MB max.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Appearance</h3>
                    <div className="space-y-3">
                      <Label>Theme</Label>
                      <div className="flex space-x-2">
                        <Button
                          variant={theme === 'light' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTheme('light')}
                        >
                          <Sun className="w-4 h-4 mr-2" />
                          Light
                        </Button>
                        <Button
                          variant={theme === 'dark' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTheme('dark')}
                        >
                          <Moon className="w-4 h-4 mr-2" />
                          Dark
                        </Button>
                        <Button
                          variant={theme === 'system' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTheme('system')}
                        >
                          <Monitor className="w-4 h-4 mr-2" />
                          System
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="api" className="space-y-6">
              {/* Gemini API Key Card */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-blue-500" />
                    Google Gemini API
                  </CardTitle>
                  <CardDescription>
                    Use your own Gemini API key for unlimited AI app generation. Get your free API key from{' '}
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gemini-key">Gemini API Key</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="gemini-key"
                        type={showGeminiKey ? 'text' : 'password'}
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="Enter your Gemini API key (starts with AIza...)"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                      >
                        {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    {/* Test Result */}
                    {geminiTestResult && (
                      <Alert variant={geminiTestResult.valid ? "default" : "destructive"}>
                        {geminiTestResult.valid ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <AlertDescription>
                          {geminiTestResult.valid 
                            ? "✅ API key is valid and working!" 
                            : `❌ ${geminiTestResult.error}`
                          }
                        </AlertDescription>
                      </Alert>
                    )}

                    <p className="text-sm text-muted-foreground">
                      Your API key is stored securely in your browser and never sent to our servers.
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handleRemoveGeminiKey}
                      disabled={!geminiApiKey}
                    >
                      Remove Key
                    </Button>
                    <Button 
                      onClick={handleSaveGeminiKey}
                      disabled={isTestingGemini}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      {isTestingGemini ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save & Test
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      How to get your Gemini API key:
                    </h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                      <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a></li>
                      <li>Sign in with your Google account</li>
                      <li>Click "Create API Key" and select a project</li>
                      <li>Copy the API key (starts with "AIza...")</li>
                      <li>Paste it here and click "Save & Test"</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Other API Keys Card */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Other API Keys</CardTitle>
                  <CardDescription>
                    Connect additional AI services and backend providers (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="openai-key">OpenAI API Key</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="openai-key"
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-..."
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Optional: Use your own OpenAI API key for unlimited generations
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supabase-url">Supabase URL</Label>
                      <Input
                        id="supabase-url"
                        placeholder="https://your-project.supabase.co"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                      <Input
                        id="supabase-key"
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      />
                      <p className="text-sm text-muted-foreground">
                        Optional: Connect your own Supabase project for backend features
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save API Keys
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email Notifications</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about your projects via email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, email: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Push Notifications</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications in your browser
                        </p>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, push: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Marketing Communications</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about new features and tips
                        </p>
                      </div>
                      <Switch
                        checked={notifications.marketing}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, marketing: checked }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    Manage your subscription and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center">
                        Pro Plan
                        <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-purple-600">
                          Current
                        </Badge>
                      </h3>
                      <p className="text-muted-foreground">
                        Unlimited projects, advanced AI models, priority support
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">$29</p>
                      <p className="text-sm text-muted-foreground">per month</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Usage This Month</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border border-border rounded-lg">
                        <p className="text-2xl font-bold text-blue-500">23</p>
                        <p className="text-sm text-muted-foreground">Projects Generated</p>
                      </div>
                      <div className="text-center p-4 border border-border rounded-lg">
                        <p className="text-2xl font-bold text-purple-500">156</p>
                        <p className="text-sm text-muted-foreground">AI Requests</p>
                      </div>
                      <div className="text-center p-4 border border-border rounded-lg">
                        <p className="text-2xl font-bold text-green-500">8.2 GB</p>
                        <p className="text-sm text-muted-foreground">Storage Used</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/pricing">
                      <Button variant="outline" className="w-full sm:w-auto">
                        Change Plan
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Download Invoice
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto text-red-600 hover:text-red-700">
                      Cancel Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}