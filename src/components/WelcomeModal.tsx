import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Play, 
  Code, 
  MessageSquare, 
  Download, 
  Sparkles,
  ArrowRight,
  Lightbulb
} from 'lucide-react'

interface WelcomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appDescription?: string
  technologies?: string[]
}

export function WelcomeModal({ open, onOpenChange, appDescription, technologies }: WelcomeModalProps) {
  const features = [
    {
      icon: <Code className="w-5 h-5 text-blue-500" />,
      title: "Live Code Editor",
      description: "Edit your generated code with Monaco Editor"
    },
    {
      icon: <Play className="w-5 h-5 text-green-500" />,
      title: "Instant Preview",
      description: "See changes in real-time with hot reload"
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-purple-500" />,
      title: "AI Assistant",
      description: "Ask Gemini AI to fix bugs and add features"
    },
    {
      icon: <Download className="w-5 h-5 text-orange-500" />,
      title: "Export Code",
      description: "Download your project as a complete package"
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <DialogTitle className="text-2xl">Welcome to the Playground!</DialogTitle>
          </div>
          <DialogDescription className="text-lg">
            Your app has been generated successfully. Here's what you can do:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {appDescription && (
            <Card className="border-border/50 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">Your App</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{appDescription}</p>
                    {technologies && technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {technologies.map((tech, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                {feature.icon}
                <div>
                  <h4 className="font-medium text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
              Quick Tips
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Click files in the explorer to open them in the editor</li>
              <li>• Use the AI Assistant to improve your code or fix bugs</li>
              <li>• Hit "Run" to build and preview your app</li>
              <li>• Export your project when you're ready to deploy</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button 
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Start Coding
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}