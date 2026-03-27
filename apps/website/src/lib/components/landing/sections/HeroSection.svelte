<script lang="ts">
  import { onMount } from "svelte";

  import BokehParticles from "../BokehParticles.svelte";
  import ScrollReveal from "../ScrollReveal.svelte";

  let loaded = $state(false);

  onMount(() => {
    setTimeout(() => {
      loaded = true;
    }, 100);
  });
</script>

<section
  class="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-0 pb-20 sm:px-6 lg:px-8 xl:px-12"
>
  <!-- Bokeh particle background -->
  <div class="absolute inset-0 z-0">
    <BokehParticles />
  </div>
  <div class="relative z-10 mx-auto w-full max-w-7xl">
    <div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <!-- Left content -->
      <div class="text-center lg:text-left">
        <!-- Badge -->
        <div
          class="bg-primary/10 border-primary/20 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-all duration-700"
          class:opacity-0={!loaded}
          class:translate-y-4={!loaded}
          class:opacity-100={loaded}
          class:translate-y-0={loaded}
        >
          <span class="relative flex h-2 w-2">
            <span
              class="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            ></span>
            <span class="bg-primary relative inline-flex h-2 w-2 rounded-full"></span>
          </span>
          <span class="text-primary text-sm font-medium">AI-Powered for SMEs</span>
        </div>

        <!-- Headline -->
        <h1
          class="text-foreground mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
          class:opacity-0={!loaded}
          class:translate-y-4={!loaded}
          class:opacity-100={loaded}
          class:translate-y-0={loaded}
          style="transition: all 0.7s ease-out 0.1s;"
        >
          Your Store,{" "}
          <span
            class="from-primary via-chart-2 to-chart-4 bg-gradient-to-r bg-clip-text text-transparent"
          >
            Supercharged
          </span>{" "}
          by AI
        </h1>

        <!-- Subheadline -->
        <p
          class="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg sm:text-xl lg:mx-0"
          class:opacity-0={!loaded}
          class:translate-y-4={!loaded}
          class:opacity-100={loaded}
          class:translate-y-0={loaded}
          style="transition: all 0.7s ease-out 0.2s;"
        >
          The complete store management platform built for small and medium businesses. Manage
          inventory, process sales with QR codes, and automate your social media—all powered by AI.
        </p>

        <!-- CTAs -->
        <div
          class="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
          class:opacity-0={!loaded}
          class:translate-y-4={!loaded}
          class:opacity-100={loaded}
          class:translate-y-0={loaded}
          style="transition: all 0.7s ease-out 0.3s;"
        >
          <a
            href="/signup"
            class="text-primary-foreground bg-primary hover:bg-primary/90 shadow-primary/25 inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            Start Free Trial
            <svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
          <a
            href="#features"
            class="text-foreground bg-card border-border hover:bg-accent inline-flex items-center justify-center rounded-xl border px-8 py-4 text-base font-semibold transition-all duration-200"
          >
            See How It Works
          </a>
        </div>

        <!-- Trust badges -->
        <div
          class="text-muted-foreground mt-10 flex items-center justify-center gap-6 text-sm lg:justify-start"
          class:opacity-0={!loaded}
          class:translate-y-4={!loaded}
          class:opacity-100={loaded}
          class:translate-y-0={loaded}
          style="transition: all 0.7s ease-out 0.4s;"
        >
          <div class="flex items-center gap-2">
            <svg class="text-chart-4 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>No credit card required</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="text-chart-4 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
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
          <div class="bg-card border-border relative overflow-hidden rounded-2xl border shadow-2xl">
            <div
              class="from-muted to-background flex aspect-[4/3] items-center justify-center bg-gradient-to-br"
            >
              <div class="p-8 text-center">
                <div
                  class="from-primary to-chart-2 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br"
                >
                  <svg
                    class="text-primary-foreground h-10 w-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </div>
                <p class="text-muted-foreground font-medium">Dashboard Preview</p>
                <p class="text-muted-foreground/60 mt-1 text-sm">Replace with actual screenshot</p>
              </div>
            </div>

            <!-- Floating stats card -->
            <div
              class="bg-card border-border animate-float-delay absolute bottom-2 left-6 rounded-xl border p-4 shadow-xl"
            >
              <div class="flex items-center gap-3">
                <div class="bg-chart-4/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <svg
                    class="text-chart-4 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">Today's Sales</p>
                  <p class="text-foreground text-lg font-bold">$2,847</p>
                </div>
              </div>
            </div>

            <!-- Floating AI card -->
            <div
              class="bg-card border-border animate-float-slow absolute top-4 right-4 rounded-xl border p-4 shadow-xl"
            >
              <div class="flex items-center gap-2">
                <div class="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-full">
                  <svg
                    class="text-primary h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div class="text-sm">
                  <p class="text-foreground font-medium">AI Powered</p>
                  <p class="text-muted-foreground text-xs">Auto-updating inventory</p>
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
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes float-slow {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-15px);
    }
  }

  .animate-float-delay {
    animation: float-delay 3s ease-in-out infinite;
  }

  .animate-float-slow {
    animation: float-slow 4s ease-in-out infinite;
  }
</style>
