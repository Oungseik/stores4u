<script lang="ts">
  import ScrollReveal from '../ScrollReveal.svelte';
  import BokehParticles from '../BokehParticles.svelte';
  
  let activeView = $state<'owner' | 'customer'>('owner');
</script>

<section class="relative py-24 px-4 sm:px-6 lg:px-8 xl:px-12">
  <div class="absolute inset-0 z-0">
    <BokehParticles count={60} />
  </div>
  <div class="relative z-10 max-w-7xl mx-auto">
    <!-- Section header -->
    <ScrollReveal>
      <div class="text-center max-w-3xl mx-auto mb-12">
        <span class="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          Dual Experience
        </span>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
          Built for{' '}
          <span class="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            both sides
          </span>
        </h2>
        <p class="text-lg text-muted-foreground">
          A seamless experience whether you're managing your store or shopping as a customer.
        </p>
      </div>
    </ScrollReveal>
    
    <!-- View toggle -->
    <ScrollReveal delay={100}>
      <div class="flex justify-center mb-12">
        <div class="inline-flex p-1 bg-muted rounded-xl border border-border">
          <button
            class="px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            class:bg-card={activeView === 'owner'}
            class:text-foreground={activeView === 'owner'}
            class:shadow-sm={activeView === 'owner'}
            class:text-muted-foreground={activeView !== 'owner'}
            class:hover:text-foreground={activeView !== 'owner'}
            onclick={() => activeView = 'owner'}
          >
            Store Owner
          </button>
          <button
            class="px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            class:bg-card={activeView === 'customer'}
            class:text-foreground={activeView === 'customer'}
            class:shadow-sm={activeView === 'customer'}
            class:text-muted-foreground={activeView !== 'customer'}
            class:hover:text-foreground={activeView !== 'customer'}
            onclick={() => activeView = 'customer'}
          >
            Customer
          </button>
        </div>
      </div>
    </ScrollReveal>
    
    <!-- Content based on active view -->
    <ScrollReveal delay={200}>
      {#if activeView === 'owner'}
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Dashboard Preview -->
          <div class="order-2 lg:order-1">
            <!-- 
              PLACEHOLDER IMAGE
              Dimensions: 1200x900px
              Type: Admin Dashboard Screenshot
              Description: Full admin dashboard interface showing sidebar navigation, 
                          main content area with product grid, sales charts, AI suggestions,
                          and quick action buttons
              Style: Modern SaaS dashboard with purple accent colors, clean cards layout,
                    left sidebar, top header with notifications and profile
              Context: This should show the comprehensive store management interface
            -->
            <div class="relative rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
              <div class="aspect-[4/3] bg-gradient-to-br from-muted to-background flex items-center justify-center">
                <div class="text-center p-8">
                  <div class="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-xl shadow-primary/20">
                    <svg class="w-12 h-12 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                    </svg>
                  </div>
                  <h3 class="text-xl font-semibold text-foreground mb-2">Admin Dashboard</h3>
                  <p class="text-muted-foreground mb-4">Complete store management interface</p>
                  <p class="text-sm text-muted-foreground/60">Replace with actual dashboard screenshot</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right: Features list -->
          <div class="order-1 lg:order-2 space-y-6">
            <h3 class="text-2xl font-bold text-foreground">Everything you need to manage your business</h3>
            
            <div class="space-y-4">
              {#each [
                { title: 'Inventory Management', desc: 'Track stock levels, receive AI-powered reorder suggestions, and manage suppliers all in one place.' },
                { title: 'Sales Analytics', desc: 'Real-time insights into your sales performance, popular products, and customer trends.' },
                { title: 'AI Assistant', desc: 'Your virtual business partner that suggests optimizations, creates content, and automates tasks.' },
                { title: 'Order Management', desc: 'Process orders, track fulfillment, and communicate with customers seamlessly.' }
              ] as feature}
                <div class="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
                  <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <div>
                    <h4 class="font-semibold text-foreground mb-1">{feature.title}</h4>
                    <p class="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {:else}
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Features list -->
          <div class="space-y-6">
            <h3 class="text-2xl font-bold text-foreground">A seamless shopping experience for your customers</h3>
            
            <div class="space-y-4">
              {#each [
                { title: 'Quick QR Access', desc: 'Customers scan your store QR code to instantly browse your products—no app download required.' },
                { title: 'Easy Product Search', desc: 'Smart search helps customers find exactly what they need with filters and categories.' },
                { title: 'One-Tap Checkout', desc: 'Streamlined checkout process with saved payment methods and quick reorder options.' },
                { title: 'Order Tracking', desc: 'Customers can track their orders in real-time and receive automatic updates.' }
              ] as feature}
                <div class="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
                  <div class="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-chart-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <div>
                    <h4 class="font-semibold text-foreground mb-1">{feature.title}</h4>
                    <p class="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Right: Mobile Preview -->
          <div>
            <!-- 
              PLACEHOLDER IMAGE
              Dimensions: 400x800px (mobile portrait)
              Type: Mobile Store Screenshot
              Description: Mobile view of a customer-facing store showing product grid,
                          search bar, category navigation, and a product card
              Style: Mobile-optimized e-commerce interface, clean white background,
                    product images in grid, bottom navigation bar
              Context: Show how customers see and interact with the store on mobile
            -->
            <div class="relative max-w-sm mx-auto">
              <!-- Phone frame -->
              <div class="relative rounded-[3rem] bg-card border-8 border-border overflow-hidden shadow-2xl">
                <div class="aspect-[9/19] bg-gradient-to-br from-muted to-background flex items-center justify-center">
                  <div class="text-center p-6">
                    <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-chart-4 to-chart-3 flex items-center justify-center">
                      <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                      </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-foreground mb-1">Mobile Store</h3>
                    <p class="text-sm text-muted-foreground">Customer shopping experience</p>
                  </div>
                </div>
                
                <!-- Home indicator -->
                <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-foreground/20 rounded-full"></div>
              </div>
              
              <!-- Floating notification -->
              <div class="absolute -top-4 -right-4 bg-card border border-border rounded-xl shadow-xl p-3 animate-float-delay">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-chart-4/20 flex items-center justify-center">
                    <svg class="w-4 h-4 text-chart-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <div class="text-xs">
                    <p class="font-medium text-foreground">Order Confirmed!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </ScrollReveal>
  </div>
</section>

<style>
  @keyframes float-delay {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .animate-float-delay {
    animation: float-delay 3s ease-in-out infinite;
  }
</style>
