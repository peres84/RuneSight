
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Brain,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Star,
  CheckCircle,
  Lock
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from '../ui/Logo';
import { ScrollToTop } from '../ui/ScrollToTop';
import { VideoBackground } from '../ui/VideoBackground';
import { RiotButton } from '../ui/RiotButton';

interface LandingPageProps {
  onGetStarted: () => void;
}

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Get personalized insights from specialized AI agents trained on League of Legends data',
    color: 'text-runesight-primary'
  },
  {
    icon: TrendingUp,
    title: 'Performance Tracking',
    description: 'Track your improvement over time with detailed match analysis and performance metrics',
    color: 'text-runesight-secondary'
  },
  {
    icon: Users,
    title: 'Social Comparisons',
    description: 'Compare your performance with friends and analyze team synergies',
    color: 'text-runesight-accent'
  },
  {
    icon: MessageSquare,
    title: 'Interactive Chat',
    description: 'Ask questions in natural language and get instant insights about your gameplay',
    color: 'text-runesight-primary'
  },
  {
    icon: BarChart3,
    title: 'Rich Visualizations',
    description: 'Beautiful charts and graphs that make your data easy to understand',
    color: 'text-runesight-secondary'
  },
  {
    icon: Lock,
    title: 'Privacy First',
    description: 'Your data stays local. We only use publicly available Riot Games data',
    color: 'text-runesight-accent'
  }
];

const AGENTS = [
  {
    name: 'Performance Analyst',
    description: 'Analyzes your individual match performance and identifies improvement areas',
    specialties: ['KDA Analysis', 'Damage Patterns', 'Objective Control']
  },
  {
    name: 'Champion Expert',
    description: 'Provides champion-specific advice, builds, and matchup analysis',
    specialties: ['Build Optimization', 'Matchup Analysis', 'Meta Insights']
  },
  {
    name: 'Team Synergy Specialist',
    description: 'Evaluates team compositions and player synergies',
    specialties: ['Draft Analysis', 'Team Comps', 'Role Synergy']
  },
  {
    name: 'Comparison Analyst',
    description: 'Compares your performance with friends and other players',
    specialties: ['Friend Analysis', 'Benchmarking', 'Duo Synergy']
  },
  {
    name: 'Match Summarizer',
    description: 'Creates comprehensive match summaries and retrospectives',
    specialties: ['Game Summaries', 'Season Reviews', 'Achievement Tracking']
  }
];

const TESTIMONIALS = [
  {
    name: 'Alex Chen',
    rank: 'Diamond II',
    quote: 'RuneSight helped me identify my weak points and climb from Plat to Diamond in just two months!',
    rating: 5
  },
  {
    name: 'Sarah Kim',
    rank: 'Gold I',
    quote: 'The AI insights are incredibly detailed. I finally understand what I was doing wrong in team fights.',
    rating: 5
  },
  {
    name: 'Mike Rodriguez',
    rank: 'Platinum III',
    quote: 'Love the friend comparison feature. Our duo queue improved so much after using RuneSight.',
    rating: 5
  }
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="nav" forceWhite={true} />

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="relative text-white/80 hover:text-runesight-accent transition-all duration-300 font-medium uppercase tracking-wider text-sm group"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-runesight-accent to-runesight-secondary group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="#agents"
                className="relative text-white/80 hover:text-runesight-accent transition-all duration-300 font-medium uppercase tracking-wider text-sm group"
              >
                AI Agents
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-runesight-accent to-runesight-secondary group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="#testimonials"
                className="relative text-white/80 hover:text-runesight-accent transition-all duration-300 font-medium uppercase tracking-wider text-sm group"
              >
                Testimonials
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-runesight-accent to-runesight-secondary group-hover:w-full transition-all duration-300"></span>
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <ThemeToggle forceWhite={true} />
              <RiotButton
                variant="primary"
                size="sm"
                onClick={onGetStarted}
              >
                Get Started
              </RiotButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen overflow-hidden" style={{ position: 'relative' }}>
        {/* Video Background with local video */}
        <VideoBackground
          videoSrc="/Video-Hero.webm"
          className="absolute inset-0 w-full h-full"
          fallbackImage="/background-hero.png"
          overlay={true}
        />

        {/* Centered Content Container */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 30 }}>
          <div className="container mx-auto px-4 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-5xl mx-auto"
            >
              {/* Main title with RuneSight brand colors */}
              <motion.h1
                className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-text-white to-text-white drop-shadow-3xl tracking-tight"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                RUNESIGHT
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-lg sm:text-xl md:text-2xl text-white/90 mb-4 font-medium tracking-wide uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                AI-Powered League of Legends Analytics
              </motion.p>

              <motion.p
                className="text-base sm:text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Dominate the Rift with personalized insights from specialized AI agents.
                Analyze your gameplay, compare with friends, and climb the ladder.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <RiotButton
                  variant="primary"
                  size="lg"
                  onClick={onGetStarted}
                  className="min-w-[200px]"
                >
                  <span>Start Analysis</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </RiotButton>

                <RiotButton
                  variant="secondary"
                  size="lg"
                  className="min-w-[200px]"
                >
                  <span>Watch Demo</span>
                </RiotButton>
              </motion.div>

              {/* Features preview */}
              <motion.div
                className="text-sm text-white/60 space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                <p className="uppercase tracking-wider font-semibold">Free • No Download • Instant Access</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Champion Showcase Section */}
      <section
        className="py-20 px-4 pl-8 relative bg-cover bg-center"
        style={{
          backgroundImage: "url('/background-textures.avif')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80 dark:from-background dark:via-background/98 dark:to-background/90" />

        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content Column */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8 pl-8"
            >
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src="/logo-precision-light-mode.png"
                  alt="Precision"
                  className="w-8 h-8 dark:hidden"
                />
                <img
                  src="/logo-precision-dark-mode.png"
                  alt="Precision"
                  className="w-8 h-8 hidden dark:block"
                />
                <span className="text-runesight-accent font-bold uppercase tracking-wider">Precision Analytics</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                MASTER YOUR
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-runesight-accent to-runesight-secondary">
                  CHAMPION
                </span>
              </h2>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Get champion-specific insights powered by AI analysis of thousands of matches.
                Learn optimal builds, master matchups, and understand your champion's power spikes
                to dominate every game.
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-runesight-accent rounded-full" />
                  <span className="text-foreground">Optimal build paths for every matchup</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-runesight-accent rounded-full" />
                  <span className="text-foreground">Power spike timing analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-runesight-accent rounded-full" />
                  <span className="text-foreground">Matchup-specific strategies</span>
                </div>
              </div>

              <div className="pt-6">
                <RiotButton variant="gold" size="md">
                  Explore Champions
                </RiotButton>
              </div>
            </motion.div>

            {/* Irelia Image Column */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                <img
                  src="/irelia.png"
                  alt="Irelia Champion"
                  className="w-full h-auto max-w-lg mx-auto"
                />
                {/* Removed gradient overlay */}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 pl-8 bg-slate-900 dark:bg-slate-950 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container mx-auto relative z-10 pl-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center space-x-4 mb-6">
                <img
                  src="/logo-precision-dark-mode.png"
                  alt="Precision"
                  className="w-8 h-8"
                />
                <span className="text-runesight-accent font-bold uppercase tracking-wider">Game Features</span>
              </div>

              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                DOMINATE THE
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-runesight-accent to-runesight-secondary">
                  COMPETITION
                </span>
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Unleash your potential with AI-powered analytics designed for champions who refuse to settle for anything less than victory.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 overflow-hidden"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 100%, 16px 100%)'
                }}
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative z-10 p-8">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-runesight-accent/20 to-runesight-secondary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)' }}>
                    <feature.icon className="w-8 h-8 text-runesight-accent group-hover:text-runesight-secondary transition-colors duration-300" />
                  </div>

                  <h3 className="text-xl font-bold mb-4 text-white group-hover:text-runesight-accent transition-colors duration-300 uppercase tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Border accent */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-runesight-accent/40 transition-colors duration-300"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 100%, 16px 100%)' }} />

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-4 h-4 bg-runesight-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section
        id="agents"
        className="py-20 px-4 pl-8 relative overflow-hidden"
        style={{
          backgroundImage: "url('/background-hero.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-runesight-primary/90 via-runesight-primary/80 to-runesight-primary/90" />

        {/* Animated background elements with brand colors */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-runesight-accent/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-runesight-secondary/20 rounded-full blur-3xl"
            animate={{
              scale: [1.3, 1, 1.3],
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="container mx-auto relative z-10 pl-8">
          {/* Section Header */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center space-x-4 mb-8">
              <img
                src="/logo-precision-dark-mode.png"
                alt="Precision"
                className="w-8 h-8 dark:block"
              />
              <span className="text-runesight-accent font-bold uppercase tracking-wider text-lg">AI Specialists</span>
            </div>

            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              MEET YOUR
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-runesight-accent to-runesight-secondary">
                AI COACHES
              </span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              Five specialized AI agents, each expert in different aspects of League of Legends,
              ready to elevate your gameplay to the next level.
            </p>
          </motion.div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {AGENTS.map((agent, index) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative bg-gradient-to-br from-runesight-primary/90 to-runesight-primary/70 backdrop-blur-sm border border-runesight-accent/30 hover:border-runesight-accent/60 transition-all duration-300 overflow-hidden"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)'
                }}
              >
                {/* Removed gradient hover effect */}

                {/* Agent number */}
                <div className="absolute top-4 right-6 text-6xl font-black text-runesight-accent/30 group-hover:text-runesight-accent/50 transition-colors duration-300">
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* Content */}
                <div className="relative z-10 p-8">
                  <h3 className="text-2xl font-black mb-4 text-white group-hover:text-runesight-accent transition-colors duration-300 uppercase tracking-wide">
                    {agent.name}
                  </h3>
                  <p className="text-white/80 leading-relaxed mb-6 text-base">
                    {agent.description}
                  </p>

                  {/* Specialties */}
                  <div className="space-y-2">
                    {agent.specialties.map((specialty, specialtyIndex) => (
                      <motion.div
                        key={specialty}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + specialtyIndex * 0.1 }}
                        className="flex items-center space-x-3"
                      >
                        <div className="w-2 h-2 bg-runesight-accent rounded-full" />
                        <span className="text-white/90 text-sm font-medium">{specialty}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Border accent with brand colors */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-runesight-accent/40 transition-colors duration-300"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)' }} />

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-6 h-6 bg-runesight-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <RiotButton variant="primary" size="lg" onClick={onGetStarted}>
              Start Your Journey
            </RiotButton>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 pl-8 bg-muted/30">
        <div className="container mx-auto pl-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Players Say</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of players who've improved their game with RuneSight
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30, rotateY: -10 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ duration: 0.7, delay: index * 0.2 }}
                whileHover={{ y: -10, rotateY: 5 }}
                className="group bg-gradient-to-br from-background to-background/90 rounded-2xl p-8 border border-border/50 hover:border-runesight-accent/30 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Quote background decoration */}
                <div className="absolute top-4 right-4 text-6xl text-runesight-accent/10 font-serif leading-none">"</div>

                {/* Stars with animation */}
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + i * 0.1 }}
                    >
                      <Star className="w-5 h-5 text-runesight-accent fill-current mr-1 group-hover:scale-110 transition-transform duration-300" />
                    </motion.div>
                  ))}
                </div>

                <p className="text-muted-foreground mb-6 italic text-lg leading-relaxed relative z-10">"{testimonial.quote}"</p>

                <div className="flex items-center relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-runesight-primary to-runesight-accent rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-runesight-accent font-medium">{testimonial.rank}</p>
                  </div>
                </div>

                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-runesight-accent/5 via-transparent to-runesight-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 pl-8 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-runesight-primary/10 to-runesight-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center relative z-10 pl-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm rounded-3xl p-12 border border-border/50 shadow-2xl"
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Climb the Ladder?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start your journey to better gameplay with personalized AI insights.
              No account required, completely free to use.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <RiotButton
                onClick={onGetStarted}
                variant="primary"
                size="lg"
                className="text-lg"
              >
                <span>Get Started Now</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </RiotButton>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-runesight-secondary" />
                <span>No account required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-runesight-secondary" />
                <span>Privacy first</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-runesight-secondary" />
                <span>Always free</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 pl-8 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto pl-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground max-w-xs">
                AI-powered League of Legends analytics platform designed by gamers, for gamers.
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>❤️ Irelia/Akali lover</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Quick Links</h3>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-muted-foreground hover:text-runesight-accent transition-colors">
                  Features
                </a>
                <a href="#agents" className="block text-sm text-muted-foreground hover:text-runesight-accent transition-colors">
                  AI Agents
                </a>
                <a href="#testimonials" className="block text-sm text-muted-foreground hover:text-runesight-accent transition-colors">
                  Testimonials
                </a>
              </div>
            </div>

            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">By Gamers, For Gamers</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>📍 Berlin, Germany</p>
                <p>🎮 Made with passion for the League community</p>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-xs text-muted-foreground text-center md:text-left max-w-2xl">
                RuneSight is not endorsed by Riot Games and does not reflect the views or opinions
                of Riot Games or anyone officially involved in producing or managing Riot Games properties.
              </p>

              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>© 2025 RuneSight</span>
                <span>•</span>
                <span>Made in Berlin 🇩🇪</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}