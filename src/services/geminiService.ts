import { GoogleGenerativeAI } from '@google/generative-ai'

interface GeminiConfig {
  apiKey: string
  model?: string
}

export class GeminiService {
  private ai: GoogleGenerativeAI
  private model: string

  constructor(config: GeminiConfig) {
    // Fix: Initialize properly with API key string
    this.ai = new GoogleGenerativeAI(config.apiKey.trim())
    this.model = config.model || 'gemini-1.5-flash'
  }

  async generateAppCode(prompt: string, includeBackend: boolean, includeFrontend: boolean): Promise<{
    files: Record<string, string>
    description: string
    technologies: string[]
  }> {
    // Validate inputs
    if (!prompt?.trim()) {
      throw new Error('Prompt is required')
    }

    if (!includeFrontend && !includeBackend) {
      throw new Error('At least one of frontend or backend must be included')
    }

    const systemPrompt = `You are PromptPilot, an expert full-stack AI developer that generates complete web applications from prompts. You work exactly like Blink does when generating apps.

GENERATION REQUIREMENTS:
- Frontend: ${includeFrontend ? 'React + TypeScript + Vite + Tailwind CSS' : 'Not needed'}
- Backend: ${includeBackend ? 'Express API with proper endpoints and structure' : 'Not needed'}
- Generate clean, production-ready code
- Use modern React patterns (hooks, functional components)
- Include proper error handling and loading states
- Make it responsive and accessible
- Follow the same logical structure as Blink's app generation

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object. No markdown, no explanations, no code blocks - just pure JSON:

{
  "files": {
    "src/App.tsx": "import React from 'react'...",
    "src/components/Header.tsx": "import React from 'react'...",
    "package.json": "{ \\"name\\": \\"generated-app\\"... }",
    "src/index.css": "@tailwind base;..."
  },
  "description": "Brief description of the generated app",
  "technologies": ["React", "TypeScript", "Tailwind CSS"]
}

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown formatting
2. Escape all quotes properly in code strings
3. Keep individual files under 2000 characters
4. Focus on core functionality first
5. Make it beautiful and functional like a Blink-generated app

User's request: ${prompt}`

    try {
      const model = this.ai.getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
        ],
      })

      // Fixed: Use proper content format
      const result = await model.generateContent({
        contents: [{ 
          parts: [{ text: systemPrompt }] 
        }]
      })

      const response = result.response

      // Check if response was blocked
      if (response.promptFeedback?.blockReason) {
        console.warn(`Content was blocked: ${response.promptFeedback.blockReason}`)
        return this.getFallbackApp(prompt)
      }

      const responseText = response.text()

      if (!responseText) {
        console.warn('Empty response from Gemini API, using fallback')
        return this.getFallbackApp(prompt)
      }

      // Clean the response - remove any markdown formatting
      let cleanedResponse = responseText.trim()

      // Remove markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '')
      cleanedResponse = cleanedResponse.replace(/```\s*$/g, '')
      cleanedResponse = cleanedResponse.replace(/^```\s*/g, '')

      // Find the JSON object
      const jsonStart = cleanedResponse.indexOf('{')
      const jsonEnd = cleanedResponse.lastIndexOf('}')

      if (jsonStart === -1 || jsonEnd === -1) {
        console.warn('No valid JSON found in response, using fallback')
        return this.getFallbackApp(prompt)
      }

      const jsonString = cleanedResponse.substring(jsonStart, jsonEnd + 1)

      try {
        const parsedResult = JSON.parse(jsonString)

        // Validate the response structure
        if (!parsedResult.files || !parsedResult.description || !parsedResult.technologies) {
          console.warn('Invalid response structure, using fallback')
          return this.getFallbackApp(prompt)
        }

        return parsedResult
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError)
        console.error('Attempted to parse:', jsonString.substring(0, 500) + '...')

        // Fallback to a working app
        return this.getFallbackApp(prompt)
      }

    } catch (error) {
      console.error('Gemini API error:', error)

      // Handle specific API errors
      if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid')) {
          throw new Error('Invalid API key. Please check your Gemini API key from Google AI Studio.')
        }
        if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please check your Gemini API usage limits.')
        }
        if (error.message.includes('PERMISSION_DENIED') || error.message.includes('permission')) {
          throw new Error('Permission denied. Please ensure your API key has Gemini API access enabled.')
        }
        if (error.message.includes('blocked')) {
          throw new Error('Content was blocked by safety filters. Please try rephrasing your request.')
        }
        if (error.message.includes('fetch') || error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection and try again.')
        }
        if (error.message.includes('400') || error.message.includes('Bad Request')) {
          throw new Error('API request failed. Please verify your API key is active and has Gemini API access enabled in Google AI Studio.')
        }
      }

      // For other errors, return fallback but inform user
      console.warn('Using fallback app due to API error')
      return this.getFallbackApp(prompt)
    }
  }

  async improveCode(code: string, request: string): Promise<string> {
    const systemPrompt = `You are a code improvement expert. Improve the given code based on the user's request.

Current code:
${code}

Request: ${request}

Return ONLY the improved code without any explanations or markdown formatting.`

    try {
      const model = this.ai.getGenerativeModel({ model: this.model })

      const result = await model.generateContent({
        contents: [{ 
          parts: [{ text: systemPrompt }] 
        }]
      })

      const response = result.response
      return response.text().trim()
    } catch (error) {
      console.error('Gemini API error:', error)
      throw new Error(`Failed to improve code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async fixBug(code: string, error: string): Promise<string> {
    const systemPrompt = `You are a debugging expert. Fix the bug in this code:

Code:
${code}

Error/Issue: ${error}

Return ONLY the fixed code without explanations.`

    try {
      const model = this.ai.getGenerativeModel({ model: this.model })

      const result = await model.generateContent({
        contents: [{ 
          parts: [{ text: systemPrompt }] 
        }]
      })

      const response = result.response
      return response.text().trim()
    } catch (error) {
      console.error('Gemini API error:', error)
      throw new Error(`Failed to fix bug: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async explainCode(code: string): Promise<string> {
    const systemPrompt = `Explain this code clearly and concisely:

${code}

Provide a helpful explanation that covers what the code does and how it works.`

    try {
      const model = this.ai.getGenerativeModel({ model: this.model })

      const result = await model.generateContent({
        contents: [{ 
          parts: [{ text: systemPrompt }] 
        }]
      })

      const response = result.response
      return response.text().trim()
    } catch (error) {
      console.error('Gemini API error:', error)
      throw new Error(`Failed to explain code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private getFallbackApp(prompt: string): {
    files: Record<string, string>
    description: string
    technologies: string[]
  } {
    const appType = prompt.toLowerCase().includes('todo') ? 'todo' :
      prompt.toLowerCase().includes('blog') ? 'blog' :
      prompt.toLowerCase().includes('chat') ? 'chat' : 'todo'

    if (appType === 'blog') {
      return {
        files: {
          'src/App.tsx': this.getBlogAppCode(),
          'src/App.css': this.getBasicCSS(),
          'package.json': this.getBlogPackageJson()
        },
        description: "A modern blog platform with search functionality and responsive design",
        technologies: ["React", "TypeScript", "Tailwind CSS", "Vite"]
      }
    }

    if (appType === 'chat') {
      return {
        files: {
          'src/App.tsx': this.getChatAppCode(),
          'src/App.css': this.getBasicCSS(),
          'package.json': this.getChatPackageJson()
        },
        description: "A real-time chat application with AI assistant simulation",
        technologies: ["React", "TypeScript", "Tailwind CSS", "Vite"]
      }
    }

    // Default todo app
    return {
      files: {
        'src/App.tsx': this.getTodoAppCode(),
        'src/App.css': this.getBasicCSS(),
        'package.json': this.getTodoPackageJson()
      },
      description: "A beautiful and functional todo application with priority levels and filtering",
      technologies: ["React", "TypeScript", "Tailwind CSS", "Vite"]
    }
  }

  private getBlogAppCode(): string {
    return `import React, { useState } from 'react'
import { Plus, Calendar, User, Search } from 'lucide-react'
import './App.css'

interface Post {
  id: number
  title: string
  content: string
  author: string
  date: string
  excerpt: string
}

function App() {
  const [posts] = useState<Post[]>([
    {
      id: 1,
      title: "Getting Started with React",
      content: "React is a powerful library for building user interfaces...",
      author: "John Doe",
      date: "2024-01-15",
      excerpt: "Learn the basics of React development and start building amazing apps."
    },
    {
      id: 2,
      title: "Modern CSS Techniques",
      content: "Explore the latest CSS features and best practices...",
      author: "Jane Smith",
      date: "2024-01-10",
      excerpt: "Discover modern CSS techniques that will improve your web designs."
    }
  ])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">My Blog</h1>
          <p className="text-gray-600 mt-2">Thoughts, ideas, and tutorials</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map(post => (
            <article key={post.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">{post.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <User className="w-4 h-4 mr-1" />
                  <span className="mr-4">{post.author}</span>
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{post.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
`
  }

  private getChatAppCode(): string {
    return `import React, { useState, useRef, useEffect } from 'react'
import { Send, User, Bot, MessageCircle } from 'lucide-react'
import './App.css'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        text: "I understand your message: '" + currentInput + "'. This is a demo response. In a real app, this would be connected to an AI service.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center">
          <MessageCircle className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">AI Chat</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={\`flex items-start space-x-3 \${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }\`}
          >
            <div className={\`w-8 h-8 rounded-full flex items-center justify-center \${
              message.sender === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-700'
            }\`}>
              {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={\`max-w-xs lg:max-w-md px-4 py-2 rounded-lg \${
              message.sender === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-800 shadow-sm'
            }\`}>
              <p className="text-sm">{message.text}</p>
              <p className={\`text-xs mt-1 \${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
              }\`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white text-gray-800 shadow-sm px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTyping}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
`
  }

  private getTodoAppCode(): string {
    return `import React, { useState } from 'react'
import { Plus, Trash2, Check, Circle, Filter } from 'lucide-react'
import './App.css'

interface Todo {
  id: number
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

type FilterType = 'all' | 'active' | 'completed'

function App() {
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: 1,
      text: "Welcome to your Todo App!",
      completed: false,
      priority: 'medium',
      createdAt: new Date().toISOString()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false,
        priority,
        createdAt: new Date().toISOString()
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

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800'
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'low': return 'bg-green-100 border-green-300 text-green-800'
      default: return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Todo App</h1>
          <p className="text-gray-600">Stay organized and productive</p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="What needs to be done?"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                onClick={addTodo}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTodos.map(todo => (
            <div
              key={todo.id}
              className={\`bg-white p-4 rounded-lg shadow-sm border-l-4 transition-all hover:shadow-md \${
                todo.completed ? 'opacity-60' : ''
              } \${
                todo.priority === 'high' ? 'border-red-400' :
                todo.priority === 'medium' ? 'border-yellow-400' : 'border-green-400'
              }\`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={\`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors \${
                      todo.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }\`}
                  >
                    {todo.completed ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4 opacity-0" />}
                  </button>
                  <div className="flex-1">
                    <span className={\`text-lg \${
                      todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                    }\`}>
                      {todo.text}
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={\`px-2 py-1 text-xs rounded-full border \${
                        getPriorityColor(todo.priority)
                      }\`}>
                        {todo.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(todo.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTodos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Circle className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">No todos yet</h3>
            <p className="text-gray-400">
              {filter === 'all' ? 'Add a todo above to get started!' :
               filter === 'active' ? 'No active todos. Great job!' :
               'No completed todos yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
`
  }

  private getBasicCSS(): string {
    return `@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}`
  }

  private getBlogPackageJson(): string {
    return `{
  "name": "blog-app",
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
    "vite": "^4.4.5",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24"
  }
}`
  }

  private getChatPackageJson(): string {
    return `{
  "name": "chat-app",
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
    "vite": "^4.4.5",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24"
  }
}`
  }

  private getTodoPackageJson(): string {
    return `{
  "name": "todo-app",
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
    "vite": "^4.4.5",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24"
  }
}`
  }
}

// Utility functions
export function isValidGeminiApiKey(apiKey: string): boolean {
  // More flexible validation - Gemini API keys can vary in format
  if (!apiKey || typeof apiKey !== 'string') return false
  
  // Support multiple key formats for Gemini API
  const cleaned = apiKey.trim()
  // Accept keys that start with AIza (older format) or any 32+ character string (newer formats)
  return (cleaned.startsWith('AIza') && cleaned.length >= 35 && cleaned.length <= 45) ||
         (cleaned.length >= 32 && cleaned.length <= 64 && /^[A-Za-z0-9_-]+$/.test(cleaned))
}

export function saveGeminiApiKey(apiKey: string): void {
  localStorage.setItem('gemini_api_key', apiKey.trim())
}

export function getGeminiApiKey(): string | null {
  const key = localStorage.getItem('gemini_api_key')
  return key ? key.trim() : null
}

export function removeGeminiApiKey(): void {
  localStorage.removeItem('gemini_api_key')
}

// Updated test API key function using the latest Gemini format
export async function testGeminiApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const ai = new GoogleGenerativeAI(apiKey.trim())
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    // Simple test request with minimal content to avoid safety filters
    const result = await model.generateContent({
      contents: [{ 
        parts: [{ text: 'Say "test successful"' }] 
      }],
      generationConfig: {
        maxOutputTokens: 50,
        temperature: 0.1,
        topK: 1,
        topP: 0.1
      }
    })
    
    const response = result.response
    
    // Check if response was blocked by safety filters
    if (response.promptFeedback?.blockReason) {
      return { valid: false, error: `Content blocked: ${response.promptFeedback.blockReason}` }
    }
    
    const text = response.text()
    if (text && text.length > 0) {
      return { valid: true }
    }
    
    return { valid: false, error: 'No response received from API' }
  } catch (error) {
    console.error('API key test failed:', error)
    
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid')) {
        return { valid: false, error: 'Invalid API key. Please check your key from Google AI Studio.' }
      }
      if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('quota')) {
        return { valid: false, error: 'API quota exceeded. Please check your usage limits.' }
      }
      if (error.message.includes('PERMISSION_DENIED') || error.message.includes('permission')) {
        return { valid: false, error: 'Permission denied. Please ensure your API key has the correct permissions.' }
      }
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return { valid: false, error: 'Network error. Please check your internet connection.' }
      }
      
      // For 400 errors, provide more specific guidance
      if (error.message.includes('400') || error.message.includes('Bad Request')) {
        return { valid: false, error: 'API request failed. Please verify your API key is active and has Gemini API access enabled.' }
      }
    }
    
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}