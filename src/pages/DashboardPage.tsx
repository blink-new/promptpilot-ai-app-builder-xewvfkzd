import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Rocket, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Calendar, 
  Code, 
  Eye, 
  Download, 
  Trash2,
  Filter,
  Grid,
  List,
  Star
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  type: 'frontend' | 'fullstack' | 'backend'
  status: 'generating' | 'ready' | 'error'
  createdAt: string
  lastModified: string
  preview?: string
}

export function DashboardPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'frontend' | 'fullstack' | 'backend'>('all')

  const mockProjects: Project[] = [
    {
      id: 'project-1',
      name: 'Todo App',
      description: 'A simple todo application with user authentication and real-time sync',
      type: 'fullstack',
      status: 'ready',
      createdAt: '2024-01-15',
      lastModified: '2024-01-15',
      preview: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop'
    },
    {
      id: 'project-2',
      name: 'E-commerce Store',
      description: 'Modern e-commerce platform with shopping cart and payment processing',
      type: 'fullstack',
      status: 'ready',
      createdAt: '2024-01-14',
      lastModified: '2024-01-14',
      preview: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop'
    },
    {
      id: 'project-3',
      name: 'Landing Page',
      description: 'Beautiful landing page for a SaaS product',
      type: 'frontend',
      status: 'ready',
      createdAt: '2024-01-13',
      lastModified: '2024-01-13',
      preview: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop'
    },
    {
      id: 'project-4',
      name: 'Chat Application',
      description: 'Real-time chat app with rooms and file sharing',
      type: 'fullstack',
      status: 'generating',
      createdAt: '2024-01-12',
      lastModified: '2024-01-12'
    }
  ]

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || project.type === filterType
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'generating': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getTypeColor = (type: Project['type']) => {
    switch (type) {
      case 'frontend': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      case 'fullstack': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'backend': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    }
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
              <Link to="/prompt">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </Link>
              <Button variant="outline">Settings</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Projects</h1>
            <p className="text-muted-foreground">
              Manage and explore your AI-generated applications
            </p>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    {filterType === 'all' ? 'All Types' : filterType}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterType('all')}>
                    All Types
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('frontend')}>
                    Frontend
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('fullstack')}>
                    Full Stack
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('backend')}>
                    Backend
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex border border-border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Projects Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow border-border/50 bg-card/50 backdrop-blur-sm group">
                    <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
                      {project.preview ? (
                        <img
                          src={project.preview}
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Code className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      {project.status === 'generating' && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {project.description}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(project.type)} variant="secondary">
                            {project.type}
                          </Badge>
                          <Badge className={getStatusColor(project.status)} variant="secondary">
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-xs text-muted-foreground mb-4">
                        <Calendar className="w-3 h-3 mr-1" />
                        Created {project.createdAt}
                      </div>
                      
                      <Link to={`/playground/${project.id}`}>
                        <Button 
                          className="w-full"
                          disabled={project.status === 'generating'}
                        >
                          {project.status === 'generating' ? 'Generating...' : 'Open Project'}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Code className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{project.name}</h3>
                            <p className="text-sm text-muted-foreground">{project.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getTypeColor(project.type)} variant="secondary">
                                {project.type}
                              </Badge>
                              <Badge className={getStatusColor(project.status)} variant="secondary">
                                {project.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Created {project.createdAt}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Link to={`/playground/${project.id}`}>
                            <Button 
                              disabled={project.status === 'generating'}
                            >
                              {project.status === 'generating' ? 'Generating...' : 'Open'}
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <Code className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'Try adjusting your search or filters' : 'Start building your first AI-powered application'}
              </p>
              <Link to="/prompt">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Project
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}