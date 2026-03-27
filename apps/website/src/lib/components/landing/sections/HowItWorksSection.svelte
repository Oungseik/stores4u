<script lang="ts">
  import ScrollReveal from '../ScrollReveal.svelte';
  
  const steps = [
    {
      number: '01',
      title: 'Set Up Your Store',
      description: 'Create your store in minutes. Add products, set pricing, and configure your business profile. Our AI helps categorize and organize everything.',
      icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </svg>`
    },
    {
      number: '02',
      title: 'Connect & Configure',
      description: 'Link your social media accounts, set up payment methods, and configure the AI assistant. We support Facebook, TikTok, Viber, Telegram, and more.',
      icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>`
    },
    {
      number: '03',
      title: 'Sell & Grow',
      description: 'Start accepting orders with QR code checkout. The AI manages inventory, creates social posts, and provides insights to help you grow your business.',
      icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>`
    }
  ];
</script>

<section id="how-it-works" class="py-24 px-4 sm:px-6 lg:px-8 xl:px-12 bg-muted/50">
  <div class="max-w-7xl mx-auto">
    <!-- Section header -->
    <ScrollReveal>
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span class="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          How It Works
        </span>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
          Get started in{' '}
          <span class="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            three simple steps
          </span>
        </h2>
        <p class="text-lg text-muted-foreground">
          From setup to your first sale, our platform makes it easy to launch and manage your online store.
        </p>
      </div>
    </ScrollReveal>
    
    <!-- Steps -->
    <div class="relative">
      <!-- Connection line (desktop only) -->
      <div class="hidden lg:block absolute top-24 left-0 right-0 h-0.5">
        <div class="max-w-4xl mx-auto relative h-full">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent"></div>
          <div class="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-primary/50 to-transparent"></div>
        </div>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8 lg:gap-12">
        {#each steps as step, index}
          <ScrollReveal delay={index * 150}>
            <div class="relative text-center group">
              <!-- Step number badge -->
              <div class="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-chart-2 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div class="relative w-16 h-16 rounded-xl bg-card border-2 border-primary flex items-center justify-center shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform duration-300">
                  <span class="text-2xl font-bold bg-gradient-to-br from-primary to-chart-2 bg-clip-text text-transparent">
                    {step.number}
                  </span>
                </div>
                
                <!-- Icon overlay -->
                <div class="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                  {@html step.icon}
                </div>
              </div>
              
              <!-- Content -->
              <h3 class="text-xl font-bold text-foreground mb-3">{step.title}</h3>
              <p class="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          </ScrollReveal>
        {/each}
      </div>
    </div>
    
    <!-- Bottom CTA -->
    <ScrollReveal delay={450}>
      <div class="mt-16 text-center">
        <a 
          href="/signup" 
          class="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-primary/25"
        >
          Start Your Free Trial
          <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </a>
      </div>
    </ScrollReveal>
  </div>
</section>
