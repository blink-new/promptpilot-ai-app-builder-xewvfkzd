import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { 
  Rocket, 
  Play, 
  Download, 
  Share, 
  Settings, 
  Plus,
  File,
  Folder,
  FolderOpen,
  MessageSquare,
  Send,
  X,
  Monitor,
  Smartphone,
  Sparkles,
  AlertCircle,
  Loader2,
  Save,
  RefreshCw,
  Bot,
  Edit3,
  Trash2,
  ExternalLink
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import { blink } from '@/blink/client'
import AIAgent, { ProjectFile, Project } from '@/services/aiAgent'

interface FileNode {
  name: string
  type: 'file' | 'folder'
  path: string
  content?: string
  children?: FileNode[]
}

export function NewPlaygroundPage() {
  const { id } = useParams()
  const location = useLocation()
  const { projectId, generated } = location.state || {}
  
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>('')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [buildOutput, setBuildOutput] = useState<string[]>([])
  const [showOutput, setShowOutput] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Handle authentication
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setAuthLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!user || !id) return

      try {
        setLoading(true)
        const agent = new AIAgent(projectId || id, user.id)
        
        const [projectData, filesData] = await Promise.all([
          agent.getProject(),
          agent.getProjectFiles()
        ])

        if (!projectData) {
          setError('Project not found')
          return
        }

        setProject(projectData)
        setFiles(filesData)

        // Auto-open the main App file
        const mainFile = filesData.find(f => f.filePath === 'src/App.tsx') || filesData[0]
        if (mainFile) {
          setSelectedFile(mainFile.filePath)
          setOpenTabs([mainFile.filePath])
          setActiveTab(mainFile.filePath)
        }

        // Welcome message for generated projects
        if (generated) {
          setChatHistory([{
            role: 'assistant',
            content: `🎉 Your app has been generated! I've created a complete ${projectData.appType} application based on your requirements.\\n\\n**Project:** ${projectData.name}\\n**Description:** ${projectData.description}\\n\\nI'm here to help you modify, improve, or add features to your app. Just ask me anything!`
          }])
        }

      } catch (err) {
        console.error('Failed to load project:', err)
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      loadProject()
    }
  }, [user, authLoading, id, projectId, generated])

  // Create file structure from flat file list
  const createFileStructure = (files: ProjectFile[]): FileNode[] => {
    const structure: FileNode[] = []
    const pathMap = new Map<string, FileNode>()

    // Sort files by path for consistent ordering
    const sortedFiles = [...files].sort((a, b) => a.filePath.localeCompare(b.filePath))

    sortedFiles.forEach(file => {
      const parts = file.filePath.split('/')
      let currentPath = ''
      let currentLevel = structure

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1
        currentPath = currentPath ? `${currentPath}/${part}` : part

        if (isFile) {
          // This is a file
          const fileNode: FileNode = {
            name: part,
            type: 'file',
            path: file.filePath,
            content: file.content
          }
          currentLevel.push(fileNode)
        } else {
          // This is a folder
          let folderNode = pathMap.get(currentPath)
          if (!folderNode) {
            folderNode = {
              name: part,
              type: 'folder',
              path: currentPath,
              children: []
            }
            pathMap.set(currentPath, folderNode)
            currentLevel.push(folderNode)
          }
          currentLevel = folderNode.children!
        }
      })
    })

    return structure
  }

  const fileStructure = createFileStructure(files)

  const openFile = (filePath: string) => {
    if (!openTabs.includes(filePath)) {
      setOpenTabs([...openTabs, filePath])
    }
    setActiveTab(filePath)
    setSelectedFile(filePath)
  }

  const closeTab = (filePath: string) => {
    const newTabs = openTabs.filter(tab => tab !== filePath)
    setOpenTabs(newTabs)
    
    if (activeTab === filePath && newTabs.length > 0) {
      setActiveTab(newTabs[0])
      setSelectedFile(newTabs[0])
    }
  }

  const handleCodeChange = async (value: string | undefined) => {
    if (value !== undefined && selectedFile && user) {
      // Update local state immediately
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.filePath === selectedFile 
            ? { ...file, content: value }
            : file
        )
      )

      // Debounced save to database
      try {
        const agent = new AIAgent(project?.id || id!, user.id)
        await agent.modifyFile(selectedFile, `Update file content: ${value}`)
      } catch (error) {
        console.error('Failed to save file:', error)
      }
    }
  }

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !user || !project) return
    
    setIsAiThinking(true)
    setChatHistory(prev => [...prev, { role: 'user', content: chatMessage }])
    
    try {
      const agent = new AIAgent(project.id, user.id)
      const response = await agent.chat(chatMessage, `Current file: ${selectedFile}`)
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error('Chat failed:', error)
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setIsAiThinking(false)
      setChatMessage('')
    }
  }

  const handleRunProject = async () => {
    setIsRunning(true)
    setBuildOutput([])
    setShowOutput(true)
    
    const outputs = [
      "🚀 Starting build process...",
      "📦 Installing dependencies...",
      "⚡ Building React app with Vite...",
      "🔄 Optimizing bundle...",
      "✅ Build completed successfully!",
      "🌐 Starting development server...",
      "🎉 App is running!"
    ]
    
    for (let i = 0; i < outputs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setBuildOutput(prev => [...prev, outputs[i]])
    }
    
    setIsRunning(false)
  }

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node, index) => (
      <div key={index} style={{ paddingLeft: `${depth * 12}px` }}>
        {node.type === 'folder' ? (
          <div>
            <div className="flex items-center py-1 px-2 hover:bg-muted/50 rounded cursor-pointer text-sm">
              <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
              {node.name}
            </div>
            {node.children && renderFileTree(node.children, depth + 1)}
          </div>
        ) : (
          <div
            className={`flex items-center py-1 px-2 hover:bg-muted/50 rounded cursor-pointer text-sm ${
              selectedFile === node.path ? 'bg-blue-100 dark:bg-blue-900/30' : ''
            }`}
            onClick={() => openFile(node.path)}
          >
            <File className="w-4 h-4 mr-2 text-muted-foreground" />
            {node.name}
          </div>
        )}
      </div>
    ))
  }

  const currentFileContent = files.find(f => f.filePath === selectedFile)?.content || ''

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link to="/prompt">
            <Button>Create New Project</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Show auth required
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access the playground</p>
          <Button onClick={() => blink.auth.login()}>Sign In</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                PromptPilot
              </span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {project?.name || 'Project'}
              </Badge>
              {project?.description && (
                <span className="text-sm text-muted-foreground max-w-md truncate">
                  {project.description}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRunProject}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run
                </>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setChatOpen(!chatOpen)}
              className={chatOpen ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowOutput(!showOutput)}
              className={showOutput ? 'bg-green-100 dark:bg-green-900/30' : ''}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Console
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full border-r border-border">
              <div className="p-3 border-b border-border">
                <h3 className="font-medium text-sm">Explorer</h3>
                {project && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {project.appType}
                    </Badge>
                  </div>
                )}
              </div>
              <ScrollArea className="h-full p-2">
                {fileStructure.length > 0 ? (
                  renderFileTree(fileStructure)
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No files found
                  </div>
                )}
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Code Editor */}
          <ResizablePanel defaultSize={50}>
            <div className="h-full flex flex-col">
              {/* Tabs */}
              <div className="border-b border-border bg-muted/30">
                <div className="flex items-center">
                  {openTabs.map(tab => (
                    <div
                      key={tab}
                      className={`flex items-center px-3 py-2 border-r border-border cursor-pointer text-sm ${
                        activeTab === tab ? 'bg-background' : 'bg-muted/50 hover:bg-muted'
                      }`}
                      onClick={() => {
                        setActiveTab(tab)
                        setSelectedFile(tab)
                      }}
                    >
                      <File className="w-4 h-4 mr-2" />
                      {tab.split('/').pop()}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          closeTab(tab)
                        }}
                        className="ml-2 hover:bg-muted-foreground/20 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1">
                {selectedFile ? (
                  <Editor
                    height="100%"
                    language={selectedFile.endsWith('.tsx') || selectedFile.endsWith('.ts') ? 'typescript' : 
                             selectedFile.endsWith('.json') ? 'json' :
                             selectedFile.endsWith('.css') ? 'css' : 'javascript'}
                    theme="vs-dark"
                    value={currentFileContent}
                    onChange={handleCodeChange}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: false, // Disable to prevent ResizeObserver conflicts
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: 'on',
                      smoothScrolling: true,
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <File className="w-8 h-8 mx-auto mb-2" />
                      <p>Select a file to edit</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Preview Panel */}
          <ResizablePanel defaultSize={30}>
            <div className="h-full border-l border-border">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <h3 className="font-medium text-sm">Preview</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {showOutput ? (
                <div className="h-full flex flex-col">
                  <div className="p-3 border-b border-border">
                    <h4 className="font-medium text-sm">Build Output</h4>
                  </div>
                  <div className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-y-auto">
                    {buildOutput.map((line, index) => (
                      <div key={index} className="mb-1">
                        {line}
                      </div>
                    ))}
                    {isRunning && (
                      <div className="flex items-center">
                        <div className="w-2 h-4 bg-green-400 animate-pulse mr-2"></div>
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full p-4 bg-gray-100 dark:bg-gray-900">
                  <div className={`h-full bg-white rounded-lg shadow-sm overflow-hidden ${
                    previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
                  }`}>
                    <div className="w-full h-full bg-white rounded-lg flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Play className="w-8 h-8 mx-auto mb-2" />
                        <p>Live preview coming soon</p>
                        <p className="text-sm">Click "Run" to build</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* AI Chat Sidebar */}
        {chatOpen && (
          <div className="w-80 border-l border-border bg-background flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <h3 className="font-medium">AI Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChatOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Ask me to modify your code, add features, or explain how things work!
              </p>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-100 dark:bg-blue-900/30 ml-4'
                        : 'bg-muted mr-4'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
                {isAiThinking && (
                  <div className="bg-muted mr-4 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setChatMessage('Add a new feature to this file')}
                    className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80"
                  >
                    Add feature
                  </button>
                  <button
                    onClick={() => setChatMessage('Fix any bugs in this code')}
                    className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80"
                  >
                    Fix bugs
                  </button>
                  <button
                    onClick={() => setChatMessage('Explain how this code works')}
                    className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80"
                  >
                    Explain code
                  </button>
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    disabled={isAiThinking}
                  />
                  <Button size="sm" onClick={sendChatMessage} disabled={isAiThinking}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}