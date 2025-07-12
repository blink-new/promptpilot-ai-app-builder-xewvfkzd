import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Rocket, 
  Sparkles, 
  Code, 
  Server, 
  Globe, 
  Lightbulb,
  Zap,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Bot,
  Wand2,
  Settings,
  Brain,
  Key
} from 'lucide-react'
import { blink } from '@/blink/client'
import AIAgent from '@/services/aiAgent'
import { GeminiService, getGeminiApiKey } from '@/services/geminiService'

export function NewPromptPage() {
  const [prompt, setPrompt] = useState('')
  const [appType, setAppType] = useState<'web' | 'mobile'>('web')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [useGemini, setUseGemini] = useState(false)
  const navigate = useNavigate()

  // Handle authentication
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setAuthLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Check for Gemini API key
  useEffect(() => {
    const geminiKey = getGeminiApiKey()
    setHasGeminiKey(!!geminiKey)
    setUseGemini(!!geminiKey) // Default to using Gemini if available
  }, [])

  const examplePrompts = [
    "Build a task management app with drag-and-drop kanban boards, due dates, and team collaboration features",
    "Create a social media platform with posts, comments, likes, real-time chat, and user profiles",
    "Make a modern e-commerce store with product catalogs, shopping cart, payment processing, and order tracking", 
    "Build a blog platform with markdown editor, comments, search, categories, and user authentication",
    "Create a real-time chat application with rooms, file sharing, emoji reactions, and video calls",
    "Make a fitness tracking app with workout plans, progress charts, goal setting, and social features",
    "Build a project management tool with tasks, timelines, file storage, and team collaboration",
    "Create a learning management system with courses, quizzes, progress tracking, and certificates"
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setGenerationError('Please describe what you want to build.')
      return
    }

    if (!user) {
      setGenerationError('Please sign in to generate apps.')
      return
    }

    setIsGenerating(true)
    setGenerationError('')
    
    try {
      if (useGemini && hasGeminiKey) {
        // Use Gemini API directly
        const geminiKey = getGeminiApiKey()!
        const geminiService = new GeminiService({ apiKey: geminiKey })
        
        const result = await geminiService.generateAppCode(prompt, true, true)
        
        // Save the generated app to the database
        const agent = new AIAgent('', user.id)
        const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        await blink.db.projects.create({
          id: projectId,
          name: result.description.substring(0, 50) + '...',
          description: result.description,
          prompt,
          userId: user.id,
          status: 'generated',
          appType
        })

        // Save all files to database
        for (const [filePath, content] of Object.entries(result.files)) {
          const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          await blink.db.projectFiles.create({
            id: fileId,
            projectId,
            filePath,
            content,
            userId: user.id
          })
        }
        
        // Navigate to the new playground
        navigate(`/playground/${projectId}`, { 
          state: { 
            projectId,
            prompt,
            appType,
            generated: true
          }
        })
      } else {
        // Use built-in Blink AI agent
        const agent = new AIAgent('', user.id)
        const result = await agent.generateApp(prompt, appType)
        
        // Navigate to the new playground with the generated project
        navigate(`/playground/${result.project.id}`, { 
          state: { 
            projectId: result.project.id,
            prompt,
            appType,
            generated: true
          }
        })
      }
    } catch (error) {
      console.error('Generation error:', error)
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate app. Please try again.')
      setIsGenerating(false)
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Show sign in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/20">
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
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <Card className="w-96">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <CardTitle>Sign In to Continue</CardTitle>
              <p className="text-muted-foreground">
                Create amazing apps with AI - authentication required
              </p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => blink.auth.login()} 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Sign In with Blink
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
              <Link to="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <div className="text-sm text-muted-foreground">
                {user.email}
              </div>
              <Button variant="outline" onClick={() => blink.auth.logout()}>
                Sign Out
              </Button>
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
              <Wand2 className="w-3 h-3 mr-1" />
              AI App Builder
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Build anything with AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Describe your app idea and our AI agent will generate complete, production-ready applications with modern tech stack and best practices.
            </p>
          </div>

          {/* Gemini API Setup Alert */}
          {!hasGeminiKey && (
            <Alert className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
              <Brain className="w-4 h-4 text-blue-500" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Get unlimited AI generation!</strong> Connect your free Gemini API key for unlimited app generation without limits.
                  </div>
                  <Link to="/settings?tab=api">
                    <Button size="sm" variant="outline" className="ml-4">
                      <Key className="w-4 h-4 mr-2" />
                      Add API Key
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Form */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                  What do you want to build?
                </div>
                {hasGeminiKey && (
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <Badge variant="secondary" className="text-xs">
                      Using your Gemini API
                    </Badge>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="prompt" className="text-base font-medium">
                  Describe your app idea
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="I want to build a task management app with drag-and-drop boards, real-time collaboration, due dates, file attachments, and team chat. It should have a modern UI with dark mode, mobile responsive design, and integrations with calendars..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] text-base"
                  disabled={isGenerating}
                />
                <p className="text-sm text-muted-foreground">
                  Be specific about features, design preferences, and functionality you want.
                </p>
              </div>

              {/* AI Service Selection */}
              {hasGeminiKey && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-medium flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    AI Service
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Brain className="w-5 h-5 text-blue-500" />
                        <div>
                          <Label htmlFor="gemini" className="font-medium">Google Gemini</Label>
                          <p className="text-sm text-muted-foreground">Your API • Unlimited</p>
                        </div>
                      </div>
                      <Switch
                        id="gemini"
                        checked={useGemini}
                        onCheckedChange={setUseGemini}
                        disabled={isGenerating}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <div>
                          <Label htmlFor="blink" className="font-medium">Blink AI</Label>
                          <p className="text-sm text-muted-foreground">Built-in • Rate limited</p>
                        </div>
                      </div>
                      <Switch
                        id="blink"
                        checked={!useGemini}
                        onCheckedChange={(checked) => setUseGemini(!checked)}
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* App Type Selection */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  App Type
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-blue-500" />
                      <div>
                        <Label htmlFor="web" className="font-medium">Web Application</Label>
                        <p className="text-sm text-muted-foreground">React + TypeScript + Blink SDK</p>
                      </div>
                    </div>
                    <Switch
                      id="web"
                      checked={appType === 'web'}
                      onCheckedChange={(checked) => checked && setAppType('web')}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg opacity-60">
                    <div className="flex items-center space-x-3">
                      <Server className="w-5 h-5 text-purple-500" />
                      <div>
                        <Label htmlFor="mobile" className="font-medium">Mobile App</Label>
                        <p className="text-sm text-muted-foreground">React Native (Coming Soon)</p>
                      </div>
                    </div>
                    <Switch
                      id="mobile"
                      checked={appType === 'mobile'}
                      onCheckedChange={(checked) => checked && setAppType('mobile')}
                      disabled={true}
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
                disabled={!prompt.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-6 h-auto"
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Building your app with {useGemini && hasGeminiKey ? 'Gemini' : 'Blink'} AI...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Code className="w-5 h-5 mr-2" />
                    Generate Complete App
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
                      <h3 className="font-semibold text-lg">AI is building your application</h3>
                      <p className="text-muted-foreground">
                        Analyzing your requirements, generating code architecture, creating components, setting up database schema...
                      </p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
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