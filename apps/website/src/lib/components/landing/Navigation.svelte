<script lang="ts">
  import { onMount } from 'svelte';
  
  let scrolled = $state(false);
  let mobileMenuOpen = $state(false);
  
  onMount(() => {
    const handleScroll = () => {
      scrolled = window.scrollY > 50;
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });
</script>

<nav 
  class={[
    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
    scrolled && "bg-background/80 backdrop-blur-xl border-b border-border py-3",
    !scrolled && "py-4"
  ]}
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
    <div class="flex items-center justify-between">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
          <svg class="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
        </div>
        <span class="text-xl font-bold text-foreground">Stores4U</span>
      </a>
      
      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center gap-8">
        <a href="#features" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Features
        </a>
        <a href="#how-it-works" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          How It Works
        </a>
        <a href="/pricing" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Pricing
        </a>
      </div>
      
      <!-- Desktop CTAs -->
      <div class="hidden md:flex items-center gap-4">
        <a 
          href="/signin" 
          class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign In
        </a>
        <a 
          href="/signup" 
          class="px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
        >
          Get Started
        </a>
      </div>
      
      <!-- Mobile menu button -->
      <button 
        class="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        onclick={() => mobileMenuOpen = !mobileMenuOpen}
      >
        <svg class="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {#if mobileMenuOpen}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          {:else}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          {/if}
        </svg>
      </button>
    </div>
    
    <!-- Mobile menu -->
    {#if mobileMenuOpen}
      <div class="md:hidden mt-4 pb-4 border-t border-border">
        <div class="flex flex-col gap-4 pt-4">
          <a href="#features" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="/pricing" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
          <div class="pt-4 border-t border-border flex flex-col gap-3">
            <a 
              href="/signin" 
              class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </a>
            <a 
              href="/signup" 
              class="px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all duration-200 text-center"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
</nav>
