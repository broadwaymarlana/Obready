import React, { useState, useEffect } from "react";
import { Scale, ArrowRight, PlayCircle, Shield, FileText, Video, AlertCircle, Users, Briefcase, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import './_group.css';

// --- Components ---

function AnimatedCounter({ value, suffix = "", duration = 2000 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export function AffordanceForward() {
  const features = [
    {
      title: "Louisiana Legal Database",
      description: "Comprehensive, up-to-date access to Louisiana criminal statutes, case law, and local court rules.",
      icon: <FileText className="h-6 w-6 text-amber-500" />,
    },
    {
      title: "AI Document Analysis",
      description: "Upload discovery documents for instant summarization, timeline generation, and entity extraction.",
      icon: <Shield className="h-6 w-6 text-amber-500" />,
    },
    {
      title: "Surveillance Analysis",
      description: "Advanced video processing to detect inconsistencies, timestamps, and key events in surveillance footage.",
      icon: <Video className="h-6 w-6 text-amber-500" />,
    },
    {
      title: "Weakness Detection",
      description: "Automated flagging of potential evidentiary issues, procedural errors, and constitutional violations.",
      icon: <AlertCircle className="h-6 w-6 text-amber-500" />,
    },
    {
      title: "Investigator Tasks",
      description: "Generate and assign specific tasks for private investigators based on case analysis gaps.",
      icon: <Briefcase className="h-6 w-6 text-amber-500" />,
    },
    {
      title: "Witness Management",
      description: "Track statements, prior testimony, and impeachment material for every witness in your case.",
      icon: <Users className="h-6 w-6 text-amber-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-amber-500/30 dark">
      {/* Sticky Header Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" tabIndex={0} role="button">
            <div className="bg-amber-500/10 p-2 rounded-lg group-hover:bg-amber-500/20 transition-colors">
              <Scale className="h-5 w-5 text-amber-500" />
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight">ObjectionReady</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-amber-400 focus-visible:text-amber-400 focus-visible:outline-none focus-visible:underline transition-colors underline-offset-4">Features</a>
            <a href="#stats" className="hover:text-amber-400 focus-visible:text-amber-400 focus-visible:outline-none focus-visible:underline transition-colors underline-offset-4">Impact</a>
            <a href="#pricing" className="hover:text-amber-400 focus-visible:text-amber-400 focus-visible:outline-none focus-visible:underline transition-colors underline-offset-4">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="hidden sm:flex border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 h-9 px-4 transition-all" asChild>
              <a href="/api/demo-login">
                Try Demo Free
              </a>
            </Button>
            <Button className="bg-amber-500 text-slate-950 hover:bg-amber-400 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 h-9 px-4 font-semibold transition-all" asChild>
              <a href="/api/login">
                Sign In
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950 -z-10"></div>
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
          
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/5 px-4 py-1.5 rounded-full text-sm font-medium mb-8 inline-flex items-center gap-2 uppercase tracking-wider backdrop-blur-sm cursor-default hover:border-amber-500/50 transition-colors">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Premium Legal Intelligence
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-8 leading-tight">
              Master the Courtroom with <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">ObjectionReady</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              The only AI-powered platform purpose-built for Louisiana criminal defense attorneys. Anticipate prosecution strategies, analyze evidence instantly, and build unshakeable cases.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button 
                size="lg" 
                className="w-full sm:w-auto h-16 px-8 text-lg font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 group relative overflow-hidden focus-visible:ring-4 focus-visible:ring-amber-500/50 focus-visible:outline-none transition-all shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_-5px_rgba(245,158,11,0.6)] hover:-translate-y-0.5"
                asChild
              >
                <a href="/api/demo-login">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <span className="flex items-center gap-2 relative z-10">
                    <PlayCircle className="w-6 h-6" />
                    Launch Interactive Demo
                  </span>
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto h-16 px-8 text-lg font-bold border-2 border-slate-700 hover:border-amber-500/50 bg-slate-900/50 hover:bg-slate-800 text-white group focus-visible:ring-4 focus-visible:ring-slate-700 focus-visible:outline-none transition-all hover:-translate-y-0.5"
                asChild
              >
                <a href="/api/login">
                  <span className="flex items-center gap-2">
                    Enter Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </a>
              </Button>
            </div>
            
            <div className="mt-16 flex items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>No credit card required for demo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Louisiana specific</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-slate-900 border-y border-white/5">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">Tactical Advantage at Scale</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Everything you need to dissect the state's case and build a compelling defense, centralized in one secure platform.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <a 
                  key={idx} 
                  href="#" 
                  className="group block outline-none focus-visible:ring-4 focus-visible:ring-amber-500 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900 rounded-xl transition-all"
                  onClick={(e) => e.preventDefault()}
                >
                  <Card className="bg-slate-950/50 border-white/10 h-full hover:bg-slate-800/80 hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden group-hover:-translate-y-1 group-hover:shadow-[0_10px_30px_-15px_rgba(245,158,11,0.2)]">
                    <CardContent className="p-8 flex flex-col h-full">
                      <div className="bg-slate-900 w-14 h-14 rounded-lg flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 group-hover:border-amber-500/30 transition-all duration-300">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-slate-100 group-hover:text-amber-400 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-slate-400 mb-8 flex-grow leading-relaxed">
                        {feature.description}
                      </p>
                      
                      {/* Affordance: Explicit Learn More */}
                      <div className="mt-auto flex items-center font-medium text-amber-500/70 group-hover:text-amber-400 transition-colors">
                        <span className="text-sm uppercase tracking-wider">Explore feature</span>
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                      
                      {/* Interactive hover gradient */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-amber-900/10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="p-6 hover:bg-white/5 rounded-2xl transition-colors cursor-default">
                <div className="text-5xl md:text-7xl font-serif font-bold text-amber-500 mb-4 tracking-tighter">
                  <AnimatedCounter value={61} />
                </div>
                <div className="text-xl font-medium text-slate-200 mb-2">Objections</div>
                <div className="text-slate-400 text-sm uppercase tracking-widest font-semibold">Pre-configured</div>
              </div>
              <div className="p-6 hover:bg-white/5 rounded-2xl transition-colors cursor-default pt-12 md:pt-6">
                <div className="text-5xl md:text-7xl font-serif font-bold text-amber-500 mb-4 tracking-tighter">
                  <AnimatedCounter value={16} />
                </div>
                <div className="text-xl font-medium text-slate-200 mb-2">Categories</div>
                <div className="text-slate-400 text-sm uppercase tracking-widest font-semibold">Of Legal Analysis</div>
              </div>
              <div className="p-6 hover:bg-white/5 rounded-2xl transition-colors cursor-default pt-12 md:pt-6">
                <div className="text-5xl md:text-7xl font-serif font-bold text-amber-500 mb-4 tracking-tighter">
                  <AnimatedCounter value={7} />
                  <span className="text-amber-500/50">+</span>
                </div>
                <div className="text-xl font-medium text-slate-200 mb-2">Video Formats</div>
                <div className="text-slate-400 text-sm uppercase tracking-widest font-semibold">Supported natively</div>
              </div>
            </div>
          </div>
        </section>

        {/* Strong CTA Section */}
        <section className="bg-amber-500 text-slate-950 py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400 via-amber-500 to-amber-600"></div>
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
            <Scale className="h-16 w-16 mx-auto mb-8 text-slate-900/80" />
            <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-slate-950 leading-tight">
              Anticipate Every Objection. <br className="hidden md:block"/>
              Control the Courtroom.
            </h2>
            <p className="text-xl md:text-2xl text-slate-800 mb-12 font-medium">
              Join the elite tier of Louisiana defense attorneys leveraging AI to outmaneuver the prosecution.
            </p>
            
            <Button 
              size="lg" 
              className="h-16 px-10 text-xl font-bold bg-slate-950 hover:bg-slate-900 text-amber-500 group shadow-2xl focus-visible:ring-4 focus-visible:ring-slate-950/50 focus-visible:outline-none transition-transform hover:-translate-y-1"
              asChild
            >
              <a href="/api/demo-login">
                <span className="flex items-center gap-3">
                  Begin Your Journey
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                </span>
              </a>
            </Button>
            <p className="mt-6 text-slate-800 font-medium">Takes less than 2 minutes to get started.</p>
          </div>
        </section>
      </main>

      {/* Structured Footer */}
      <footer className="bg-slate-950 pt-20 pb-10 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-amber-500/10 p-2 rounded-lg">
                  <Scale className="h-6 w-6 text-amber-500" />
                </div>
                <span className="font-serif font-bold text-2xl">ObjectionReady</span>
              </div>
              <p className="text-slate-400 max-w-md leading-relaxed mb-6">
                Premium Legal Intelligence for Louisiana criminal defense. Elevating the standard of representation through advanced AI analysis.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" size="sm" className="border-white/10 hover:border-amber-500/50 hover:bg-white/5" asChild>
                  <a href="/api/login">Sign In</a>
                </Button>
                <Button size="sm" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" asChild>
                  <a href="/api/demo-login">Free Demo</a>
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-100 mb-6 uppercase tracking-wider text-sm">Platform</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors focus-visible:text-amber-400 focus-visible:outline-none focus-visible:underline underline-offset-4 inline-block p-1 -m-1">Features</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors focus-visible:text-amber-400 focus-visible:outline-none focus-visible:underline underline-offset-4 inline-block p-1 -m-1">Pricing</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors focus-visible:text-amber-400 focus-visible:outline-none focus-visible:underline underline-offset-4 inline-block p-1 -m-1">Case Studies</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors focus-visible:text-amber-400 focus-visible:outline-none focus-visible:underline underline-offset-4 inline-block p-1 -m-1">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-100 mb-6 uppercase tracking-wider text-sm">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors focus-visible:text-amber-400 focus-visible:outline-none focus-visible:underline underline-offset-4 inline-block p-1 -m-1">About Us</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors focus-visible:text-amber-400 focus-visible:outline-none focus-visible:underline underline-offset-4 inline-block p-1 -m-1">Contact</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors focus-visible:text-amber-400 focus-visible:outline-none focus-visible:underline underline-offset-4 inline-block p-1 -m-1">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors focus-visible:text-amber-400 focus-visible:outline-none focus-visible:underline underline-offset-4 inline-block p-1 -m-1">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} ObjectionReady. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Designed for Louisiana Defense Attorneys</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
