<script lang="ts">
  import { onMount } from 'svelte';
  import ScrollReveal from '../ScrollReveal.svelte';
  import BokehParticles from '../BokehParticles.svelte';
  
  let loaded = $state(false);
  
  onMount(() => {
    setTimeout(() => {
      loaded = true;
    }, 100);
  });
</script>

<section class="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-12 py-20 overflow-hidden">
  <!-- Bokeh particle background -->
  <div class="absolute inset-0 z-0">
    <BokehParticles />
  </div>
  <div class="relative z-10 max-w-7xl mx-auto w-full">
    <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
      <!-- Left content -->
      <div class="text-center lg:text-left">
        <!-- Badge -->
        <div 
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 transition-all duration-700"
          class:opacity-0={!loaded}
          class:translate-y-4={!loaded}
          class:opacity-100={loaded}
          class:translate-y-0={loaded}
        >
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span class="text-sm font-medium text-primary">AI-Powered for SMEs</span>
        </div>
        
        <!-- Headline -->
        <h1 
          class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground mb-6"
          class:opacity-0={!loaded}
          class:translate-y-4={!loaded}
          class:opacity-100={loaded}
          class:translate-y-0={loaded}
          style="transition: all 0.7s ease-out 0.1s;"
        >
          Your Store,{' '}
          <span class="bg-gradient-to-r from-primary via-chart-2 to-chart-4 bg-clip-text text-transparent">
            Supercharged
          </span>{' '}
          by AI
        </h1>
        
        <!-- Subheadline -->
        <p 
          class="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-8"
          class:opacity-0={!loaded}
          class:translate-y-4={!loaded}
          class:opacity-100={loaded}
          class:translate-y-0={loaded}
          style="transition: all 0.7s ease-out 0.2s;"
        >
          The complete store management platform built for small and medium businesses. 
          Manage inventory, process sales with QR codes, and automate your social media—all powered by AI.
        </p>
        
        <!-- CTAs -->
        <div 
          class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          class:opacity-0={!loaded}
          class:translate-y-4={!loaded}
          class:opacity-100={loaded}
          class:translate-y-0={loaded}
          style="transition: all 0.7s ease-out 0.3s;"
        >
          <a 
            href="/signup" 
            class="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-primary/25"
          >
            Start Free Trial
            <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
          <a 
            href="#features" 
            class="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-foreground bg-card border border-border rounded-xl hover:bg-accent transition-all duration-200"
          >
            See How It Works
          </a>
        </div>
        
        <!-- Trust badges -->
        <div 
          class="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground"
          class:opacity-0={!loaded}
          class:translate-y-4={!loaded}
          class:opacity-100={loaded}
          class:translate-y-0={loaded}
          style="transition: all 0.7s ease-out 0.4s;"
        >
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-chart-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>No credit card required</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-chart-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>14-day free trial</span>
          </div>
        </div>
      </div>
      
      <!-- Right content - Hero Image -->
      <ScrollReveal delay={200}>
        <div class="relative">
          <!-- Main dashboard preview -->
          <!-- 
            PLACEHOLDER IMAGE
            Dimensions: 800x600px or larger
            Type: Dashboard Screenshot
            Description: Main admin dashboard showing inventory overview, recent sales, 
                        AI suggestions, and quick stats. Should show modern SaaS UI with 
                        purple accent colors matching the design system.
            Style: Clean, modern, professional dashboard interface
            Note: Include sidebar navigation, main content area with cards/charts,
                  and a header with user profile
          -->
          <div class="relative rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
            <div class="aspect-[4/3] bg-gradient-to-br from-muted to-background flex items-center justify-center">
              <div class="text-center p-8">
                <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                  <svg class="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                  </svg>
                </div>
                <p class="text-muted-foreground font-medium">Dashboard Preview</p>
                <p class="text-sm text-muted-foreground/60 mt-1">Replace with actual screenshot</p>
              </div>
            </div>
            
            <!-- Floating stats card -->
            <div class="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl shadow-xl p-4 animate-float-delay">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-chart-4/20 flex items-center justify-center">
                  <svg class="w-5 h-5 text-chart-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Today's Sales</p>
                  <p class="text-lg font-bold text-foreground">$2,847</p>
                </div>
              </div>
            </div>
            
            <!-- Floating AI card -->
            <div class="absolute -top-4 -right-4 bg-card border border-border rounded-xl shadow-xl p-4 animate-float-slow">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <div class="text-sm">
                  <p class="font-medium text-foreground">AI Powered</p>
                  <p class="text-xs text-muted-foreground">Auto-updating inventory</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </div>
</section>

<style>
  @keyframes float-delay {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes float-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }
  
  .animate-float-delay {
    animation: float-delay 3s ease-in-out infinite;
  }
  
  .animate-float-slow {
    animation: float-slow 4s ease-in-out infinite;
  }
</style>
