import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Rocket, 
  Plus, 
  Search, 
  Calendar, 
  ExternalLink,
  Trash2,
  Edit3,
  Play,
  Download,
  Loader2,
  Bot,
  Sparkles,
  Globe,
  Smartphone,
  Filter
} from 'lucide-react'
import { blink } from '@/blink/client'
import { Project } from '@/services/aiAgent'

export function NewDashboardPage() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'web' | 'mobile'>('all')

  // Handle authentication
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setAuthLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return

      try {
        setLoading(true)
        const userProjects = await blink.db.projects.list({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' }
        })
        setProjects(userProjects)
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      loadProjects()
    }
  }, [user, authLoading])

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterType === 'all' || project.appType === filterType
    return matchesSearch && matchesFilter
  })

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      // Delete project files first
      const projectFiles = await blink.db.projectFiles.list({
        where: { projectId }
      })
      
      for (const file of projectFiles) {
        await blink.db.projectFiles.delete(file.id)
      }

      // Delete project conversations
      const conversations = await blink.db.aiConversations.list({
        where: { projectId }
      })
      
      for (const conv of conversations) {
        await blink.db.aiConversations.delete(conv.id)
      }

      // Delete project
      await blink.db.projects.delete(projectId)

      // Update local state
      setProjects(prev => prev.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
                Access your AI-generated projects and create new ones
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
              <Link to="/prompt">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              My Projects
            </h1>
            <p className="text-xl text-muted-foreground">
              Manage your AI-generated applications
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                size="sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                All
              </Button>
              <Button
                variant={filterType === 'web' ? 'default' : 'outline'}
                onClick={() => setFilterType('web')}
                size="sm"
              >
                <Globe className="w-4 h-4 mr-2" />
                Web
              </Button>
              <Button
                variant={filterType === 'mobile' ? 'default' : 'outline'}
                onClick={() => setFilterType('mobile')}
                size="sm"
                disabled
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredProjects.length === 0 && projects.length === 0 && (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first AI-generated application to get started
              </p>
              <Link to="/prompt">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              </Link>
            </Card>
          )}

          {/* No Search Results */}
          {!loading && filteredProjects.length === 0 && projects.length > 0 && (
            <Card className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </Card>
          )}

          {/* Projects Grid */}
          {!loading && filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-lg line-clamp-2">
                            {project.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {project.appType === 'web' ? (
                                <>
                                  <Globe className="w-3 h-3 mr-1" />
                                  Web App
                                </>
                              ) : (
                                <>
                                  <Smartphone className="w-3 h-3 mr-1" />
                                  Mobile App
                                </>
                              )}
                            </Badge>
                            <Badge 
                              variant={project.status === 'generated' ? 'default' : 'outline'} 
                              className="text-xs"
                            >
                              {project.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {project.description}
                        </p>
                      )}
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        Updated {formatDate(project.updatedAt)}
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Link to={`/playground/${project.id}`} className="flex-1">
                          <Button size="sm" className="w-full">
                            <Play className="w-3 h-3 mr-2" />
                            Open
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteProject(project.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}