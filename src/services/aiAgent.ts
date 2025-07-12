import { blink } from '@/blink/client'

export interface FileOperation {
  type: 'create' | 'update' | 'delete'
  path: string
  content?: string
}

export interface ProjectFile {
  id: string
  projectId: string
  filePath: string
  content: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  prompt: string | null
  userId: string
  createdAt: string
  updatedAt: string
  status: string
  appType: string
}

export class AIAgent {
  private projectId: string
  private userId: string

  constructor(projectId: string, userId: string) {
    this.projectId = projectId
    this.userId = userId
  }

  async generateApp(prompt: string, appType: 'web' | 'mobile' = 'web'): Promise<{
    project: Project
    files: ProjectFile[]
    description: string
  }> {
    // Create a comprehensive system prompt that mimics Blink's capabilities
    const systemPrompt = `You are an advanced AI agent that builds complete applications, exactly like Blink AI does.

MISSION: Generate a complete, production-ready application from the user's prompt.

CAPABILITIES YOU HAVE:
- Full-stack web application development
- Modern React + TypeScript frontends
- Database schema design and implementation
- API development and backend services
- Real-time features and integrations
- Beautiful, responsive UI/UX design
- Authentication and user management
- File storage and management
- Advanced animations and interactions

TECH STACK TO USE:
- Frontend: React 18+ with TypeScript, Vite, Tailwind CSS
- UI Components: shadcn/ui components with modern design
- Icons: Lucide React icons
- Styling: Tailwind CSS with custom design system
- State Management: React hooks and context
- Database: SQLite with Blink SDK (already available)
- Authentication: Blink SDK auth (automatic)
- Storage: Blink SDK storage for files
- AI: Blink SDK AI for intelligent features
- Realtime: Blink SDK realtime for live features

YOUR RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "projectName": "string",
  "description": "string", 
  "files": {
    "src/App.tsx": "complete React app code...",
    "src/components/Header.tsx": "component code...",
    "src/pages/HomePage.tsx": "page code...",
    "src/lib/database.ts": "database operations...",
    "src/types/index.ts": "TypeScript types...",
    "package.json": "dependencies...",
    "tailwind.config.js": "tailwind config...",
    "src/index.css": "global styles..."
  }
}

CRITICAL REQUIREMENTS:
1. Generate COMPLETE, working applications - never half-implementations
2. Use Blink SDK for all backend functionality (auth, database, storage, AI)
3. Create beautiful, modern UIs with proper responsive design
4. Include proper error handling and loading states
5. Add real-time features where appropriate using Blink SDK
6. Include proper TypeScript types and interfaces
7. Use proper database schema with user_id fields for multi-tenancy
8. Generate 8-15 files for a complete application structure
9. Make it production-ready with proper architecture
10. Focus on the core functionality but make it feature-complete

USER'S REQUEST: ${prompt}

Generate a complete application that perfectly fulfills this request. Make it impressive, functional, and production-ready.`

    try {
      // Use Blink's AI to generate the application
      const { text } = await blink.ai.generateText({
        prompt: systemPrompt,
        model: 'gpt-4o',
        maxTokens: 8000
      })

      // Parse the response
      let appData
      try {
        // Clean the response to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          appData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        // Fallback to a default app
        appData = this.getFallbackApp(prompt)
      }

      // Create project in database
      const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const projectName = appData.projectName || 'Generated App'
      const description = appData.description || 'AI-generated application'

      await blink.db.projects.create({
        id: projectId,
        name: projectName,
        description,
        prompt,
        userId: this.userId,
        status: 'generated',
        appType
      })

      // Save all files to database
      const files: ProjectFile[] = []
      for (const [filePath, content] of Object.entries(appData.files)) {
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const file = await blink.db.projectFiles.create({
          id: fileId,
          projectId,
          filePath,
          content: content as string,
          userId: this.userId
        })
        
        files.push(file)
      }

      const project = await blink.db.projects.list({
        where: { id: projectId },
        limit: 1
      })

      return {
        project: project[0],
        files,
        description
      }

    } catch (error) {
      console.error('App generation failed:', error)
      throw new Error(`Failed to generate app: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async modifyFile(filePath: string, instruction: string): Promise<string> {
    // Get current file content
    const files = await blink.db.projectFiles.list({
      where: { 
        projectId: this.projectId, 
        filePath: filePath,
        userId: this.userId 
      },
      limit: 1
    })

    if (files.length === 0) {
      throw new Error(`File ${filePath} not found`)
    }

    const currentContent = files[0].content

    // Use AI to modify the file
    const modificationPrompt = `You are an expert developer working on file modifications. 

CURRENT FILE (${filePath}):
${currentContent}

MODIFICATION REQUEST: ${instruction}

REQUIREMENTS:
- Maintain the existing code structure and patterns
- Only modify what's necessary for the requested change
- Ensure the code remains functional and follows best practices
- Keep existing imports and dependencies unless they need to change
- Use Blink SDK patterns when applicable (auth, database, storage, AI)
- Return ONLY the complete modified file content, no explanations

Return the complete modified file content:`

    try {
      const { text } = await blink.ai.generateText({
        prompt: modificationPrompt,
        model: 'gpt-4o',
        maxTokens: 4000
      })

      // Update file in database
      await blink.db.projectFiles.update(files[0].id, {
        content: text.trim(),
        updatedAt: new Date().toISOString()
      })

      return text.trim()
    } catch (error) {
      console.error('File modification failed:', error)
      throw new Error(`Failed to modify file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async createFile(filePath: string, instruction: string): Promise<string> {
    // Get project context
    const projectFiles = await blink.db.projectFiles.list({
      where: { 
        projectId: this.projectId,
        userId: this.userId 
      }
    })

    const existingFiles = projectFiles.map(f => `${f.filePath}: ${f.content.substring(0, 200)}...`).join('\n\n')

    const creationPrompt = `You are an expert developer creating a new file for an existing project.

EXISTING PROJECT STRUCTURE:
${existingFiles}

CREATE NEW FILE: ${filePath}
REQUIREMENTS: ${instruction}

IMPORTANT:
- Follow the existing project patterns and architecture
- Use consistent coding style with existing files
- Import from existing components/utilities when appropriate
- Use Blink SDK patterns (auth, database, storage, AI, realtime)
- Make it production-ready and well-structured
- Return ONLY the complete file content, no explanations

Generate the complete file content:`

    try {
      const { text } = await blink.ai.generateText({
        prompt: creationPrompt,
        model: 'gpt-4o',
        maxTokens: 3000
      })

      // Save new file to database
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const file = await blink.db.projectFiles.create({
        id: fileId,
        projectId: this.projectId,
        filePath,
        content: text.trim(),
        userId: this.userId
      })

      return text.trim()
    } catch (error) {
      console.error('File creation failed:', error)
      throw new Error(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const files = await blink.db.projectFiles.list({
      where: { 
        projectId: this.projectId, 
        filePath: filePath,
        userId: this.userId 
      },
      limit: 1
    })

    if (files.length === 0) {
      throw new Error(`File ${filePath} not found`)
    }

    await blink.db.projectFiles.delete(files[0].id)
  }

  async getProjectFiles(): Promise<ProjectFile[]> {
    return await blink.db.projectFiles.list({
      where: { 
        projectId: this.projectId,
        userId: this.userId 
      },
      orderBy: { filePath: 'asc' }
    })
  }

  async getProject(): Promise<Project | null> {
    const projects = await blink.db.projects.list({
      where: { 
        id: this.projectId,
        userId: this.userId 
      },
      limit: 1
    })

    return projects.length > 0 ? projects[0] : null
  }

  async chat(message: string, context?: string): Promise<string> {
    // Get project files for context
    const files = await this.getProjectFiles()
    const fileContext = files.map(f => `${f.filePath}:\n${f.content.substring(0, 500)}...`).join('\n\n')

    const chatPrompt = `You are an expert AI programming assistant working on a web application project.

PROJECT CONTEXT:
${fileContext}

${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

USER MESSAGE: ${message}

CAPABILITIES:
- Answer questions about the code
- Suggest improvements and modifications
- Debug issues and propose fixes
- Explain how features work
- Recommend best practices
- Help with architecture decisions

Provide a helpful, accurate response that assists with the development of this project.`

    try {
      const { text } = await blink.ai.generateText({
        prompt: chatPrompt,
        model: 'gpt-4o-mini',
        maxTokens: 1500
      })

      // Save conversation to database
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await blink.db.aiConversations.create({
        id: conversationId,
        projectId: this.projectId,
        userId: this.userId,
        message,
        response: text,
        messageType: 'chat'
      })

      return text
    } catch (error) {
      console.error('Chat failed:', error)
      throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private getFallbackApp(prompt: string) {
    const appType = prompt.toLowerCase().includes('todo') ? 'todo' :
      prompt.toLowerCase().includes('blog') ? 'blog' :
      prompt.toLowerCase().includes('chat') ? 'chat' : 'dashboard'

    return {
      projectName: `AI Generated ${appType.charAt(0).toUpperCase() + appType.slice(1)} App`,
      description: `A modern ${appType} application built with React and Blink SDK`,
      files: {
        'src/App.tsx': this.getDefaultAppCode(appType),
        'src/components/Header.tsx': this.getHeaderComponent(),
        'src/lib/auth.ts': this.getAuthUtils(),
        'package.json': this.getPackageJson(),
        'src/index.css': this.getGlobalStyles()
      }
    }
  }

  private getDefaultAppCode(type: string): string {
    return `import React, { useState, useEffect } from 'react'
import { blink } from '@/blink/client'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Welcome to ` + type.charAt(0).toUpperCase() + type.slice(1) + ` App</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => blink.auth.login()} className="w-full">
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Welcome, {user.email}!</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <Plus className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">Your ` + type + ` app is ready!</h2>
              <p className="text-gray-600 mb-6">
                This app was generated with AI and includes authentication, database, and modern UI.
              </p>
              <Button>Get Started</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default App`
  }
  private getHeaderComponent(): string {
    return `import React from 'react'
import { blink } from '@/blink/client'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

interface HeaderProps {
  user: any
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-900">Generated App</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => blink.auth.logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}`
  }

  private getAuthUtils(): string {
    return `import { blink } from '@/blink/client'

export const authUtils = {
  getCurrentUser: async () => {
    try {
      return await blink.auth.me()
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  },

  signOut: () => {
    blink.auth.logout()
  },

  signIn: () => {
    blink.auth.login()
  }
}`
  }

  private getPackageJson(): string {
    return JSON.stringify({
      name: "generated-app",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview",
        lint: "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
      },
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        "@blinkdotnew/sdk": "latest",
        "lucide-react": "^0.263.1",
        "framer-motion": "^10.16.4"
      },
      devDependencies: {
        "@types/react": "^18.2.15",
        "@types/react-dom": "^18.2.7",
        "@typescript-eslint/eslint-plugin": "^6.0.0",
        "@typescript-eslint/parser": "^6.0.0",
        "@vitejs/plugin-react": "^4.0.3",
        eslint: "^8.45.0",
        "eslint-plugin-react-hooks": "^4.6.0",
        "eslint-plugin-react-refresh": "^0.4.3",
        typescript: "^5.0.2",
        vite: "^4.4.5",
        tailwindcss: "^3.3.0",
        autoprefixer: "^10.4.14",
        postcss: "^8.4.24"
      }
    }, null, 2)
  }

  private getGlobalStyles(): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}`
  }
}

export default AIAgent