import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Rocket, 
  Play, 
  Download, 
  Share, 
  Settings, 
  Bug, 
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
  Loader2
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import { GeminiService, getGeminiApiKey } from '@/services/geminiService'

interface FileNode {
  name: string
  type: 'file' | 'folder'
  content?: string
  children?: FileNode[]
}

export function PlaygroundPage() {
  const { id } = useParams()
  const location = useLocation()
  const { 
    prompt, 
    includeBackend, 
    includeFrontend, 
    generatedFiles, 
    appDescription, 
    technologies 
  } = location.state || {}
  
  const [selectedFile, setSelectedFile] = useState<string>('src/App.tsx')
  const [files, setFiles] = useState<Record<string, string>>(generatedFiles || {})
  const [openTabs, setOpenTabs] = useState<string[]>(['src/App.tsx'])
  const [activeTab, setActiveTab] = useState<string>('src/App.tsx')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>(
    appDescription ? [{
      role: 'assistant',
      content: `I've generated your app: ${appDescription}\n\nTechnologies used: ${technologies?.join(', ') || 'React, TypeScript'}\n\nHow can I help you improve it?`
    }] : []
  )
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [buildOutput, setBuildOutput] = useState<string[]>([])
  const [showOutput, setShowOutput] = useState(false)

  // Mock file structure based on generated files
  const createFileStructure = (files: Record<string, string>): FileNode[] => {
    const structure: FileNode[] = []
    const processedDirs = new Set<string>()

    Object.keys(files).forEach(filePath => {
      const parts = filePath.split('/')
      let currentLevel = structure

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1
        const currentPath = parts.slice(0, index + 1).join('/')

        if (isFile) {
          currentLevel.push({
            name: part,
            type: 'file',
            content: files[filePath]
          })
        } else if (!processedDirs.has(currentPath)) {
          const folderNode: FileNode = {
            name: part,
            type: 'folder',
            children: []
          }
          currentLevel.push(folderNode)
          processedDirs.add(currentPath)
          currentLevel = folderNode.children!
        } else {
          const existingFolder = currentLevel.find(node => node.name === part && node.type === 'folder')
          if (existingFolder) {
            currentLevel = existingFolder.children!
          }
        }
      })
    })

    return structure
  }

  const fileStructure = Object.keys(files).length > 0 ? createFileStructure(files) : []

  // Initialize with generated files or mock data
  useEffect(() => {
    if (!generatedFiles || Object.keys(generatedFiles).length === 0) {
      // Fallback to mock data if no files were generated
      const mockFiles = {
        'src/App.tsx': `import React, { useState } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import './App.css'

interface Todo {
  id: number
  text: string
  completed: boolean
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState('')

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false
      }])
      setInputValue('')
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Todo App</h1>
        <div className="input-section">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a new todo..."
          />
          <button onClick={addTodo}>
            <Plus size={20} />
          </button>
        </div>
        <div className="todo-list">
          {todos.map(todo => (
            <div key={todo.id} className={\`todo-item \${todo.completed ? 'completed' : ''}\`}>
              <button
                className="check-btn"
                onClick={() => toggleTodo(todo.id)}
              >
                {todo.completed && <Check size={16} />}
              </button>
              <span className="todo-text">{todo.text}</span>
              <button
                className="delete-btn"
                onClick={() => deleteTodo(todo.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        {todos.length === 0 && (
          <div className="empty-state">
            <p>No todos yet. Add one above!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App`,
        'package.json': `{
  "name": "generated-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}`
      }
      setFiles(mockFiles)
    }
  }, [generatedFiles])

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

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined && selectedFile) {
      setFiles(prev => ({
        ...prev,
        [selectedFile]: value
      }))
    }
  }

  const handleRunProject = async () => {
    setIsRunning(true)
    setBuildOutput([])
    setShowOutput(true)
    
    // Simulate build process
    const outputs = [
      "🚀 Starting build process...",
      "📦 Installing dependencies...",
      "⚡ Building React app...",
      "🔄 Optimizing bundle...",
      "✅ Build completed successfully!",
      "🌐 Starting development server...",
      "🎉 App is running on http://localhost:3000"
    ]
    
    for (let i = 0; i < outputs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setBuildOutput(prev => [...prev, outputs[i]])
    }
    
    setIsRunning(false)
  }

  const handleExportProject = () => {
    // Create a blob with all the files
    const projectData = {
      name: `project-${id}`,
      description: appDescription || 'Generated with PromptPilot',
      files: files,
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "typescript": "^5.0.2",
        "vite": "^4.4.5",
        "tailwindcss": "^3.3.0",
        "lucide-react": "^0.263.1"
      }
    }
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `promptpilot-${id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return
    
    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      setChatHistory(prev => [...prev, 
        { role: 'user', content: chatMessage },
        { role: 'assistant', content: 'Please set up your Gemini API key first by going back to the prompt page.' }
      ])
      setChatMessage('')
      return
    }

    setIsAiThinking(true)
    setChatHistory(prev => [...prev, { role: 'user', content: chatMessage }])
    
    try {
      const geminiService = new GeminiService({ apiKey })
      let response = ''

      if (chatMessage.toLowerCase().includes('fix') || chatMessage.toLowerCase().includes('bug')) {
        // Bug fixing
        const currentCode = files[selectedFile] || ''
        response = await geminiService.fixBug(currentCode, chatMessage)
        
        // Update the current file with fixed code
        if (response && selectedFile && response.length > 100) {
          setFiles(prev => ({
            ...prev,
            [selectedFile]: response
          }))
          response = `I've fixed the code in ${selectedFile}. The changes have been applied automatically.`
        }
      } else if (chatMessage.toLowerCase().includes('explain')) {
        // Code explanation
        const currentCode = files[selectedFile] || ''
        response = await geminiService.explainCode(currentCode)
      } else {
        // General code improvement
        const currentCode = files[selectedFile] || ''
        response = await geminiService.improveCode(currentCode, chatMessage)
        
        // Update the current file with improved code
        if (response && selectedFile && response.length > 100) {
          setFiles(prev => ({
            ...prev,
            [selectedFile]: response
          }))
          response = `I've updated the code in ${selectedFile} based on your request. The changes have been applied automatically.`
        }
      }

      setChatHistory(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error('AI Assistant error:', error)
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key') || error.message.includes('API_KEY_INVALID')) {
          errorMessage = 'Your API key seems to be invalid. Please go back to the prompt page and enter a valid Gemini API key from Google AI Studio.'
        } else if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
          errorMessage = 'Your API quota has been exceeded. Please check your usage limits in Google AI Studio or try again later.'
        } else if (error.message.includes('blocked')) {
          errorMessage = 'Your request was blocked by safety filters. Please try rephrasing your message.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }])
    } finally {
      setIsAiThinking(false)
      setChatMessage('')
    }
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
              selectedFile === getFullPath(node, nodes, depth) ? 'bg-blue-100 dark:bg-blue-900/30' : ''
            }`}
            onClick={() => openFile(getFullPath(node, nodes, depth))}
          >
            <File className="w-4 h-4 mr-2 text-muted-foreground" />
            {node.name}
          </div>
        )}
      </div>
    ))
  }

  // Helper function to get full file path
  const getFullPath = (node: FileNode, allNodes: FileNode[], depth: number): string => {
    // For now, just return a simple path - this could be improved
    if (node.name.includes('.')) {
      const filePaths = Object.keys(files)
      const matchingPath = filePaths.find(path => path.endsWith(node.name))
      return matchingPath || node.name
    }
    return node.name
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
                Project {id}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {appDescription || 'Generated App'}
              </span>
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
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Building...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportProject}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
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
                {technologies && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {technologies.slice(0, 3).map((tech: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <ScrollArea className="h-full p-2">
                {fileStructure.length > 0 ? (
                  renderFileTree(fileStructure)
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No files available
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
                <Editor
                  height="100%"
                  language="typescript"
                  theme="vs-dark"
                  value={files[selectedFile] || '// Select a file to edit'}
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
                    {Object.keys(files).length > 0 ? (
                      <iframe
                        src={`data:text/html;charset=utf-8,<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'><script src='https://unpkg.com/react@18/umd/react.development.js'></script><script src='https://unpkg.com/react-dom@18/umd/react-dom.development.js'></script><script src='https://unpkg.com/@babel/standalone/babel.min.js'></script><script src='https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js'></script><style>body{margin:0;font-family:system-ui}</style></head><body><div id='root'></div><script type='text/babel'>const {useState} = React; const {createRoot} = ReactDOM; ${encodeURIComponent(files[selectedFile] || '')}; createRoot(document.getElementById('root')).render(<App />);</script></body></html>`}
                        className="w-full h-full border-0"
                        title="App Preview"
                        sandbox="allow-scripts"
                      />
                    ) : (
                      <div className="w-full h-full rounded-lg flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Play className="w-8 h-8 mx-auto mb-2" />
                          <p>Preview will appear here</p>
                          <p className="text-sm">Click "Run" to start</p>
                        </div>
                      </div>
                    )}
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
                  <h3 className="font-medium">Gemini AI Assistant</h3>
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
                Ask me to modify your code, fix bugs, or add features!
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
                    onClick={() => setChatMessage('Fix any bugs in this code')}
                    className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80"
                  >
                    Fix bugs
                  </button>
                  <button
                    onClick={() => setChatMessage('Explain this code')}
                    className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80"
                  >
                    Explain code
                  </button>
                  <button
                    onClick={() => setChatMessage('Add better styling')}
                    className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80"
                  >
                    Improve styling
                  </button>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Ask me anything..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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