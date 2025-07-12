import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Rocket, 
  Check, 
  Zap, 
  Star, 
  Users, 
  Code, 
  Bot, 
  Shield,
  ArrowRight
} from 'lucide-react'

interface PricingPlan {
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
  }
  features: string[]
  popular?: boolean
  icon: React.ReactNode
}

export function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)

  const plans: PricingPlan[] = [
    {
      name: 'Free',
      description: 'Perfect for getting started and learning',
      price: { monthly: 0, yearly: 0 },
      icon: <Code className="w-6 h-6" />,
      features: [
        '1 project per month',
        'Basic AI assistance',
        'Frontend generation only',
        'Community support',
        'Public projects only'
      ]
    },
    {
      name: 'Pro',
      description: 'For developers and small teams',
      price: { monthly: 29, yearly: 290 },
      icon: <Zap className="w-6 h-6" />,
      popular: true,
      features: [
        'Unlimited projects',
        'Advanced AI models (GPT-4, Claude)',
        'Full-stack generation',
        'Private projects',
        'Priority support',
        'Export to GitHub',
        'Custom AI prompts',
        'Real-time collaboration'
      ]
    },
    {
      name: 'Team',
      description: 'For growing teams and organizations',
      price: { monthly: 99, yearly: 990 },
      icon: <Users className="w-6 h-6" />,
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Advanced analytics',
        'Custom integrations',
        'SSO authentication',
        'Dedicated support',
        'Custom AI training',
        'Enterprise security'
      ]
    }
  ]

  const getPrice = (plan: PricingPlan) => {
    const price = isYearly ? plan.price.yearly : plan.price.monthly
    if (price === 0) return 'Free'
    if (isYearly) return `$${price}/year`
    return `$${price}/month`
  }

  const getSavings = (plan: PricingPlan) => {
    if (plan.price.monthly === 0) return null
    const yearlySavings = (plan.price.monthly * 12) - plan.price.yearly
    return Math.round((yearlySavings / (plan.price.monthly * 12)) * 100)
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
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
              <Star className="w-3 h-3 mr-1" />
              Pricing Plans
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Choose your perfect plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Start building with AI for free, then scale as you grow. All plans include our core features with no hidden fees.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4">
              <span className={`text-sm ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <span className={`text-sm ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Yearly
              </span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                Save up to 17%
              </Badge>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative ${plan.popular ? 'scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <Card className={`h-full border-border/50 bg-card/50 backdrop-blur-sm ${
                  plan.popular ? 'border-blue-500/50 shadow-xl' : ''
                }`}>
                  <CardHeader className="pb-8">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {plan.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {plan.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold">
                          {getPrice(plan)}
                        </span>
                        {plan.price.monthly > 0 && (
                          <span className="text-muted-foreground">
                            {isYearly ? '/year' : '/month'}
                          </span>
                        )}
                      </div>
                      {isYearly && getSavings(plan) && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Save {getSavings(plan)}% compared to monthly
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                          : ''
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.name === 'Free' ? 'Get Started' : 'Start Free Trial'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Can I change my plan later?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">What AI models do you support?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We support the latest AI models including GPT-4, Claude 3, and specialized coding models. Pro and Team plans get access to the most advanced models.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Is there a free trial?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Yes! All paid plans come with a 14-day free trial. No credit card required to start, and you can cancel anytime.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Do you offer enterprise plans?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Yes, we offer custom enterprise plans with advanced security, compliance features, and dedicated support. Contact our sales team for more information.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Card className="border-border/50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Ready to build with AI?
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join thousands of developers who are already building faster and smarter with PromptPilot. Start your free trial today!
                </p>
                <Link to="/signup">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Start Building Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}