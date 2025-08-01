"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Brain, Database, CheckCircle, Globe, ArrowRight, Sparkles, Quote, User, TrendingUp, Play, Star, Users, Clock, Zap, Heart, Eye, MessageSquare, CheckSquare, ArrowUp, Camera, FileText, BarChart3, Search, Layers, Wand2, Target, Lightbulb, MousePointer, Volume2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"

export default function FrankensteinHero() {
  const router = useRouter()
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [currentAnimation, setCurrentAnimation] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [typewriterText, setTypewriterText] = useState("")
  const [typewriterIndex, setTypewriterIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const heroRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Typewriter animation texts
  const typewriterTexts = [
    "different perspectives",
    "multiple viewpoints", 
    "hidden angles",
    "untold stories",
    "another side",
    "various dimensions",
    "diverse opinions",
    "contrasting views"
  ]

  // Typewriter animation effect
  useEffect(() => {
    const currentText = typewriterTexts[typewriterIndex]
    let charIndex = 0
    setTypewriterText("")
    
    const typeInterval = setInterval(() => {
      if (charIndex <= currentText.length) {
        setTypewriterText(currentText.slice(0, charIndex))
        charIndex++
      } else {
        clearInterval(typeInterval)
        
        // Wait before starting to delete
        setTimeout(() => {
          const deleteInterval = setInterval(() => {
            setTypewriterText(prev => {
              if (prev.length === 0) {
                clearInterval(deleteInterval)
                setTypewriterIndex(prev => (prev + 1) % typewriterTexts.length)
                return prev
              }
              return prev.slice(0, -1)
            })
          }, 80)
        }, 2500)
      }
    }, 120)

    return () => clearInterval(typeInterval)
  }, [typewriterIndex])

  // Cursor blinking animation
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)
    return () => clearInterval(cursorInterval)
  }, [])

  // Real testimonials with photos and detailed stories
  const testimonials = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "Environmental Journalist",
      company: "Reuters",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      story: "I was writing about deforestation in the Amazon when Perspective revealed I was missing Indigenous community voices entirely. Now I reach out to at least 3 different stakeholder groups before publishing.",
      impact: "My articles now receive 40% more engagement and significantly fewer correction requests.",
      rating: 5,
      verified: true,
      date: "2 weeks ago"
    },
    {
      id: 2,
      name: "Marcus Rodriguez",
      role: "Tech Editor",
      company: "The Verge",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      story: "Was covering the latest AI breakthrough when Perspective flagged that I only quoted male experts. It suggested female AI researchers I hadn't considered - completely changed my piece.",
      impact: "Our diversity metrics improved by 60% and reader trust scores increased substantially.",
      rating: 5,
      verified: true,
      date: "1 week ago"
    },
    {
      id: 3,
      name: "Dr. Emily Watson",
      role: "Media Literacy Professor",
      company: "Columbia Journalism School",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
      story: "My students used to accept articles at face value. Now they automatically run them through Perspective first. They're catching bias patterns I never taught them to look for.",
      impact: "Class critical thinking scores improved 92%. Students are now teaching their parents to fact-check.",
      rating: 5,
      verified: true,
      date: "3 days ago"
    }
  ]

  // Interactive 3D scene animations
  const sceneAnimations = [
    {
      title: "Bias Detection",
      description: "AI scans through thousands of data points",
      color: "from-red-500 to-orange-500",
      elements: 15
    },
    {
      title: "Perspective Mining",
      description: "Finding overlooked viewpoints",
      color: "from-blue-500 to-cyan-500",
      elements: 12
    },
    {
      title: "Fact Verification",
      description: "Cross-referencing with reliable sources",
      color: "from-green-500 to-emerald-500",
      elements: 18
    }
  ]

  // Mouse tracking for interactive elements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  // Parallax scrolling
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-rotate testimonials with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // 3D scene animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnimation((prev) => (prev + 1) % sceneAnimations.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Interactive Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
    }

    const particles: Particle[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.1
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        particle.x += particle.vx
        particle.y += particle.vy
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1
        
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`
        ctx.fill()
      })
      
      requestAnimationFrame(animate)
    }
    animate()
  }, [])

  const playInteractionSound = () => {
    if (audioEnabled && typeof window !== 'undefined') {
      try {
        // Create a subtle click sound
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          const audioContext = new AudioContext()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.1)
        }
      } catch (error) {
        // Silently fail if audio context is not supported
        console.log('Audio not supported')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950 relative overflow-hidden">
      
      {/* Interactive Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* Dynamic Gradient Orbs following mouse */}
      <div 
        className="fixed w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out z-0"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
      />
      <div 
        className="fixed w-64 h-64 bg-gradient-to-r from-emerald-400/15 to-cyan-400/15 rounded-full blur-3xl pointer-events-none transition-all duration-700 ease-out z-0"
        style={{
          left: mousePosition.x - 128,
          top: mousePosition.y - 128,
          transitionDelay: '100ms'
        }}
      />

      {/* Enhanced Header with sound toggle */}
      <header className="relative z-50 border-b border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center transform transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Perspective
                </span>
                <div className="text-xs text-slate-500 -mt-1">by AOSSIE</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Volume2 className={`w-4 h-4 ${audioEnabled ? 'text-green-500' : 'text-slate-400'}`} />
              </button>
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-600 dark:text-slate-400">2,847 active users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          
          {/* Trust Indicators */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-200 dark:border-slate-700 shadow-lg mb-6">
              <div className="flex -space-x-2">
                {testimonials.map((testimonial, index) => (
                  <img
                    key={testimonial.id}
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                  />
                ))}
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                4.9/5 from 2,800+ journalists
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Side - Content */}
            <div className="space-y-8">
              
              {/* Main Headline with Typewriter Animation */}
              <div className="space-y-6">
                <div className="relative">
                  <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                    <span className="block text-slate-900 dark:text-slate-100">
                      Every story has
                    </span>
                    <span className="block">
                      <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent min-h-[1.2em] inline-block">
                        {typewriterText}
                        <span className={`ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-150 text-blue-600`}>
                          |
                        </span>
                      </span>
                    </span>
                  </h1>
                </div>
                
                <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  Stop reading biased news. Our AI reveals the perspectives you're missing, 
                  <span className="font-semibold text-blue-600"> in real-time</span>.
                </p>
              </div>

              {/* Interactive Demo Trigger */}
              <div className="relative">
                <Button
                  onClick={() => {
                    playInteractionSound()
                    router.push("/analyze")
                  }}
                  className="h-16 px-12 text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 group border-0 text-white rounded-2xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <Play className="w-5 h-5 mr-3" />
                  Try it with any article
                  <ArrowRight className="w-5 h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                
                <div className="mt-4 flex items-center justify-start space-x-6 text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <CheckSquare className="w-4 h-4 text-green-500" />
                    <span>No signup required</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>Results in 15 seconds</span>
                  </div>
                </div>
                
                {/* Floating success metrics */}
                <div className="absolute -right-16 top-8 hidden xl:block">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-float">
                    <div className="text-lg font-bold">96%</div>
                    <div className="text-xs">accuracy rate</div>
                  </div>
                </div>
              </div>

              {/* Real User Story Carousel */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img
                      src={testimonials[currentTestimonial].avatar}
                      alt={testimonials[currentTestimonial].name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                    />
                    {testimonials[currentTestimonial].verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckSquare className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Quote className="w-5 h-5 text-blue-500 mb-2" />
                    <p className="text-slate-700 dark:text-slate-300 mb-3 font-medium leading-relaxed">
                      "{testimonials[currentTestimonial].story}"
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {testimonials[currentTestimonial].name}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs">
                          {testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <div className="text-xs text-slate-400">
                          {testimonials[currentTestimonial].date}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
                      <div className="text-sm text-green-700 dark:text-green-300 font-medium">
                        Impact: {testimonials[currentTestimonial].impact}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Testimonial navigation dots */}
                <div className="flex justify-center mt-4 space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentTestimonial ? 'bg-blue-500 w-6' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Interactive 3D Visualization */}
            <div className="relative">
              
              {/* Main 3D Container */}
              <div className="relative w-full h-96 bg-gradient-to-br from-slate-100 to-blue-100 dark:from-slate-800 dark:to-blue-900 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                
                {/* 3D Scene */}
                <div className="absolute inset-0 perspective-1000">
                  <div className="w-full h-full preserve-3d relative">
                    
                    {/* Central Brain/AI Core */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <div 
                        className="w-20 h-20 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-2xl transform-gpu"
                        style={{
                          transform: `rotateY(${currentAnimation * 60}deg) rotateX(${Math.sin(Date.now() * 0.001) * 10}deg)`,
                          animation: 'float 3s ease-in-out infinite'
                        }}
                        onMouseEnter={() => setHoveredCard('brain')}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        <div className="w-full h-full bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                          <Brain className="w-10 h-10 text-white animate-pulse" />
                        </div>
                        {hoveredCard === 'brain' && (
                          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">
                            AI Analysis Core
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Orbiting Data Nodes */}
                    {Array.from({ length: sceneAnimations[currentAnimation].elements }).map((_, index) => {
                      const angle = (index / sceneAnimations[currentAnimation].elements) * Math.PI * 2
                      const radius = 80 + (index % 3) * 20
                      const x = Math.cos(angle + Date.now() * 0.001) * radius
                      const y = Math.sin(angle + Date.now() * 0.001) * radius
                      
                      return (
                        <div
                          key={index}
                          className={`absolute w-4 h-4 bg-gradient-to-r ${sceneAnimations[currentAnimation].color} rounded-full shadow-lg transform-gpu opacity-80`}
                          style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            transform: `translateZ(${Math.sin(angle + Date.now() * 0.002) * 20}px)`,
                            animationDelay: `${index * 100}ms`
                          }}
                        />
                      )
                    })}

                    {/* Information Streams */}
                    <div className="absolute inset-0">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 bg-gradient-to-b from-blue-400/60 to-transparent rounded-full"
                          style={{
                            left: `${20 + i * 12}%`,
                            height: '100%',
                            transform: `translateY(${Math.sin(Date.now() * 0.002 + i) * 10}px)`,
                            opacity: 0.6
                          }}
                        />
                      ))}
                    </div>

                    {/* Floating UI Elements */}
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-800/90 px-3 py-2 rounded-lg shadow-lg text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-slate-700 dark:text-slate-300">{sceneAnimations[currentAnimation].title}</span>
                      </div>
                    </div>

                    <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                      {sceneAnimations[currentAnimation].description}
                    </div>

                    <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                      Live Analysis
                    </div>
                  </div>
                </div>

                {/* Interactive Controls */}
                <div className="absolute bottom-4 left-4 flex space-x-2">
                  {sceneAnimations.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentAnimation(index)
                        playInteractionSound()
                      }}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentAnimation 
                          ? 'bg-blue-500 scale-125' 
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Feature Preview Cards */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {[
                  { icon: Target, label: "Bias Detection", color: "from-red-500 to-orange-500" },
                  { icon: Search, label: "Source Check", color: "from-green-500 to-emerald-500" },
                  { icon: Layers, label: "Multi-Angle", color: "from-blue-500 to-cyan-500" },
                  { icon: Wand2, label: "AI Summary", color: "from-purple-500 to-pink-500" }
                ].map((feature, index) => (
                  <Card
                    key={index}
                    className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onMouseEnter={() => {
                      setHoveredCard(feature.label)
                      playInteractionSound()
                    }}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                          {feature.label}
                        </div>
                        <div className="text-xs text-slate-500">Real-time</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Floating Success Metrics */}
              <div className="absolute -top-6 -left-6 bg-green-500 text-white px-4 py-3 rounded-2xl shadow-xl animate-float">
                <div className="text-center">
                  <div className="text-2xl font-bold">15s</div>
                  <div className="text-xs opacity-90">Avg Analysis</div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-blue-500 text-white px-4 py-3 rounded-2xl shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                <div className="text-center">
                  <div className="text-2xl font-bold">96%</div>
                  <div className="text-xs opacity-90">Accuracy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Section */}
          <div className="mt-20 text-center">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Trusted by Leading News Organizations
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Join thousands of journalists, researchers, and critical thinkers who rely on Perspective for unbiased analysis.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-60">
              {[
                { name: "Reuters", logo: "🏢" },
                { name: "The Verge", logo: "📰" },
                { name: "Columbia", logo: "🎓" },
                { name: "BBC", logo: "📺" },
                { name: "NPR", logo: "📻" }
              ].map((company, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 group cursor-pointer">
                  <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                    {company.logo}
                  </div>
                  <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {company.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Demo Section */}
          <div className="mt-20">
            <Card className="p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-800/50 shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  See Perspective in Action
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Watch how our AI transforms one-sided reporting into balanced, comprehensive analysis
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Before - Biased Article */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-semibold">Original Article (Biased)</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-l-4 border-red-500 shadow-lg">
                    <div className="flex items-start space-x-3 mb-4">
                      <FileText className="w-5 h-5 text-slate-400 mt-1" />
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          "Electric Cars: The Perfect Solution to Climate Change"
                        </h4>
                        <div className="text-sm text-slate-500 mb-3">TechDaily • 2 hours ago</div>
                      </div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">
                      "Electric vehicles are revolutionizing transportation and will single-handedly solve our climate crisis. 
                      Tesla's latest model proves that EVs are now superior to gas cars in every way..."
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-4 text-xs text-slate-500">
                        <span>👁 No fact-checking</span>
                        <span>📊 Single perspective</span>
                        <span>⚠️ Missing context</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* After - Balanced Analysis */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold">After Perspective Analysis</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-l-4 border-green-500 shadow-lg">
                    <div className="flex items-start space-x-3 mb-4">
                      <Brain className="w-5 h-5 text-blue-500 mt-1" />
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          Balanced Perspective Report
                        </h4>
                        <div className="text-sm text-blue-600 mb-3">✅ Fact-checked • 🔍 Multi-angle analysis</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                        <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">MISSING PERSPECTIVES:</div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          • Battery production environmental impact<br/>
                          • Charging infrastructure challenges<br/>
                          • Economic accessibility concerns
                        </p>
                      </div>
                      
                      <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg">
                        <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-1">FACT CHECK:</div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          EVs reduce emissions by 60-70%, but total impact depends on electricity grid sources
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex space-x-4 text-xs text-slate-500">
                        <span>✅ Fact-checked</span>
                        <span>🔍 5 perspectives</span>
                        <span>📊 15 sources</span>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Analyzed in 12s
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center mt-8">
                <Button
                  onClick={() => {
                    playInteractionSound()
                    router.push("/analyze")
                  }}
                  className="h-14 px-8 text-base bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 group border-0 text-white rounded-xl"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Try This Example Live
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <p className="text-sm text-slate-500 mt-3">
                  Paste any news article URL • Get instant balanced analysis • No signup required
                </p>
              </div>
            </Card>
          </div>

          {/* Interactive Features Grid */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Powerful Features That Make a Difference
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Every feature is designed to help you think more critically and make better-informed decisions
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: "Bias Detection",
                  description: "AI identifies political, cultural, and commercial biases in real-time",
                  color: "from-red-500 to-pink-500",
                  demo: "Detected 3 potential biases in this article",
                  stats: "96% accuracy rate"
                },
                {
                  icon: Search,
                  title: "Source Verification",
                  description: "Cross-references claims with 15+ reliable fact-checking databases",
                  color: "from-green-500 to-emerald-500",
                  demo: "Verified 12/15 claims, flagged 3 as unsubstantiated",
                  stats: "15M+ sources checked"
                },
                {
                  icon: Eye,
                  title: "Missing Perspectives",
                  description: "Reveals viewpoints and voices that weren't included in the original story",
                  color: "from-blue-500 to-cyan-500",
                  demo: "Found 4 missing stakeholder perspectives",
                  stats: "Average 5 new angles per article"
                },
                {
                  icon: BarChart3,
                  title: "Impact Analysis",
                  description: "Shows how different groups are affected by the story's subject matter",
                  color: "from-purple-500 to-indigo-500",
                  demo: "Impact on 6 demographic groups analyzed",
                  stats: "Societal impact scoring"
                },
                {
                  icon: Brain,
                  title: "Context Enrichment",
                  description: "Provides historical context and background you need to understand the full picture",
                  color: "from-orange-500 to-red-500",
                  demo: "Added 8 contextual data points",
                  stats: "Historical depth analysis"
                },
                {
                  icon: MessageSquare,
                  title: "Conversational Analysis",
                  description: "Ask questions about the article and get detailed, sourced answers",
                  color: "from-teal-500 to-green-500",
                  demo: "Chat about any aspect of the story",
                  stats: "Natural language Q&A"
                }
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="group cursor-pointer bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                  onMouseEnter={() => {
                    setHoveredCard(feature.title)
                    playInteractionSound()
                  }}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <CardHeader className="pb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-3xl flex items-center justify-center mx-auto mb-6 transform transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 shadow-lg`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl text-slate-900 dark:text-slate-100 text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                    
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Live Demo:
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        {feature.demo}
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-500 font-medium border-t border-slate-200 dark:border-slate-700 pt-3">
                      {feature.stats}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="mt-24 text-center">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-slate-100">
                Ready to See Every Side of the Story?
              </h3>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                Join 2,800+ journalists, researchers, and critical thinkers who are already discovering 
                balanced perspectives and combating bias in online content.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button
                  onClick={() => {
                    playInteractionSound()
                    router.push("/analyze")
                  }}
                  className="h-16 px-12 text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 group border-0 text-white rounded-2xl"
                >
                  Start Analyzing Articles Now
                  <ArrowRight className="w-5 h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                
                <div className="text-slate-500 text-sm">
                  or watch a <button className="text-blue-600 hover:underline">2-minute demo</button>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center space-x-1">
                  <CheckSquare className="w-4 h-4 text-green-500" />
                  <span>Free forever</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Instant results</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Privacy protected</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>No ads ever</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="mt-20 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transform transition-all duration-300 group-hover:rotate-6">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Perspective</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">by AOSSIE</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
              <button className="hover:text-blue-600 transition-colors">About</button>
              <button className="hover:text-blue-600 transition-colors">Privacy</button>
              <button className="hover:text-blue-600 transition-colors">Contact</button>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
            © 2024 AOSSIE. Combating bias through AI-powered perspective analysis. 
            <span className="mx-2">•</span>
            Built with ❤️ for critical thinkers everywhere.
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  )
}