import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Rocket, 
  ArrowLeft, 
  Sparkles, 
  Code, 
  Server, 
  Globe, 
  Lightbulb,
  Zap,
  ArrowRight,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { 
  GeminiService, 
  isValidGeminiApiKey, 
  saveGeminiApiKey, 
  getGeminiApiKey,
  testGeminiApiKey 
} from '@/services/geminiService'

export function PromptPage() {
  const [prompt, setPrompt] = useState('')
  const [includeBackend, setIncludeBackend] = useState(true)
  const [includeFrontend, setIncludeFrontend] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyError, setApiKeyError] = useState('')
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)
  const [isTestingApiKey, setIsTestingApiKey] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const navigate = useNavigate()

  // Load saved API key on component mount
  useEffect(() => {
    const savedApiKey = getGeminiApiKey()
    if (savedApiKey) {
      setApiKey(savedApiKey)
      // Auto-test saved API key
      testApiKey(savedApiKey)
    }
  }, [])

  const examplePrompts = [
    "Build a todo app with user authentication and real-time sync",
    "Create a blog platform with markdown support and comments",
    "Make an e-commerce store with shopping cart and payment processing",
    "Build a chat application with rooms and file sharing",
    "Create a project management tool with kanban boards",
    "Make a social media feed with posts, likes, and followers"
  ]

  const validateApiKeyFormat = (key: string) => {
    if (!key.trim()) {
      setApiKeyError('API key is required')
      setApiKeyValid(false)
      return false
    }
    if (!isValidGeminiApiKey(key)) {
      setApiKeyError('Invalid API key format. Please check your key from Google AI Studio. It should start with "AIza" and be 35-45 characters long.')
      setApiKeyValid(false)
      return false
    }
    setApiKeyError('')
    return true
  }

  const testApiKey = async (keyToTest: string) => {
    if (!validateApiKeyFormat(keyToTest)) return

    setIsTestingApiKey(true)
    setApiKeyError('')
    
    try {
      const result = await testGeminiApiKey(keyToTest)
      
      if (result.valid) {
        setApiKeyValid(true)
        setApiKeyError('')
        saveGeminiApiKey(keyToTest) // Save valid key
      } else {
        setApiKeyValid(false)
        setApiKeyError(result.error || 'API key test failed')
      }
    } catch (error) {
      setApiKeyValid(false)
      setApiKeyError('Failed to test API key. Please check your internet connection.')
    } finally {
      setIsTestingApiKey(false)
    }
  }

  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
    setApiKeyError('')
    setApiKeyValid(null)
    
    // Auto-test valid format keys after user stops typing
    if (isValidGeminiApiKey(value.trim())) {
      const timeoutId = setTimeout(() => {
        testApiKey(value.trim())
      }, 1000)
      
      return () => clearTimeout(timeoutId)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setGenerationError('Please enter a description of what you want to build.')
      return
    }
    
    // Validate API key first
    if (!validateApiKeyFormat(apiKey)) {
      return
    }

    // Test API key if not already validated
    if (apiKeyValid !== true) {
      await testApiKey(apiKey)
      if (apiKeyValid !== true) {
        return
      }
    }

    setIsGenerating(true)
    setGenerationError('')
    
    try {
      // Initialize Gemini service
      const geminiService = new GeminiService({ apiKey: apiKey.trim() })
      
      // Generate the app
      const result = await geminiService.generateAppCode(prompt, includeBackend, includeFrontend)
      
      // Navigate to playground with generated code
      const projectId = `project-${Date.now()}`
      navigate(`/playground/${projectId}`, { 
        state: { 
          prompt, 
          includeBackend, 
          includeFrontend,
          generatedFiles: result.files,
          appDescription: result.description,
          technologies: result.technologies
        }
      })
    } catch (error) {
      console.error('Generation error:', error)
      
      // Handle specific error types
      let errorMessage = 'Failed to generate app. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key')) {
          errorMessage = 'Invalid API key. Please check your Gemini API key from Google AI Studio.'
          setApiKeyError('Invalid API key. Please verify your key from Google AI Studio.')
          setApiKeyValid(false)
        } else if (error.message.includes('quota')) {
          errorMessage = 'API quota exceeded. Please check your Gemini API usage limits in Google AI Studio.'
        } else if (error.message.includes('blocked')) {
          errorMessage = 'Content was blocked by safety filters. Please try rephrasing your request with different wording.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.'
        } else if (error.message.includes('Prompt is required')) {
          errorMessage = 'Please enter a description of what you want to build.'
        } else if (error.message.includes('At least one')) {
          errorMessage = 'Please select at least frontend or backend for your app.'
        } else {
          errorMessage = error.message
        }
      }
      
      setGenerationError(errorMessage)
      setIsGenerating(false)
    }
  }

  const getApiKeyIcon = () => {
    if (isTestingApiKey) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    }
    if (apiKeyValid === true) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    if (apiKeyValid === false) {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }
    return <Key className="w-4 h-4 text-gray-400" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/20">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80">
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
                <Button variant="ghost">My Projects</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
              <Lightbulb className="w-3 h-3 mr-1" />
              AI App Generator
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Describe your dream app
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tell our AI what you want to build, and we'll generate a complete application with clean code and modern architecture.
            </p>
          </div>

          {/* API Key Configuration */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                {getApiKeyIcon()}
                <span className="ml-2">Gemini API Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="apiKey" className="text-base font-medium">
                    Gemini API Key
                  </Label>
                  <a 
                    href="https://aistudio.google.com/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:text-blue-600 flex items-center"
                  >
                    Get Free API Key <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter your Gemini API key (AIza...)"
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    className={`pr-20 ${
                      apiKeyValid === false ? "border-red-500 focus:border-red-500" :
                      apiKeyValid === true ? "border-green-500 focus:border-green-500" : ""
                    }`}
                    disabled={isGenerating}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    {(apiKey.length > 0 && !isTestingApiKey) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => testApiKey(apiKey)}
                        disabled={!apiKey.trim()}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                {apiKeyError && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {apiKeyError}
                  </p>
                )}
                
                {apiKeyValid === true && (
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    API key verified successfully!
                  </p>
                )}
                
                {isTestingApiKey && (
                  <p className="text-sm text-blue-600 flex items-center">
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Testing API key...
                  </p>
                )}
                
                <Alert>
                  <Key className="w-4 h-4" />
                  <AlertDescription>
                    Your API key is stored locally in your browser and never sent to our servers. 
                    Get a free API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">Google AI Studio</a>.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Main Form */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                Project Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="prompt" className="text-base font-medium">
                  What would you like to build?
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe your app idea in detail. Include features, user flows, design preferences, and any specific requirements..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[150px] text-base"
                  disabled={isGenerating}
                />
                <p className="text-sm text-muted-foreground">
                  The more detailed your description, the better our AI can understand your vision.
                </p>
              </div>

              {/* Configuration Options */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Generation Options
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-blue-500" />
                      <div>
                        <Label htmlFor="frontend" className="font-medium">Frontend</Label>
                        <p className="text-sm text-muted-foreground">React + TypeScript</p>
                      </div>
                    </div>
                    <Switch
                      id="frontend"
                      checked={includeFrontend}
                      onCheckedChange={setIncludeFrontend}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Server className="w-5 h-5 text-purple-500" />
                      <div>
                        <Label htmlFor="backend" className="font-medium">Backend</Label>
                        <p className="text-sm text-muted-foreground">API + Database</p>
                      </div>
                    </div>
                    <Switch
                      id="backend"
                      checked={includeBackend}
                      onCheckedChange={setIncludeBackend}
                      disabled={isGenerating}
                    />
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {generationError && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    {generationError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || !apiKey.trim() || isGenerating || (!includeFrontend && !includeBackend)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-6 h-auto"
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Generating your app with Gemini AI...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Code className="w-5 h-5 mr-2" />
                    Generate App with Gemini
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Example Prompts */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Need inspiration? Try these examples:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {examplePrompts.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    disabled={isGenerating}
                    className="text-left p-3 rounded-lg border border-border/50 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors text-sm group"
                  >
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {example}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress Indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Creating your application with Gemini AI</h3>
                      <p className="text-muted-foreground">
                        Our AI is analyzing your prompt and generating clean, production-ready code...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}