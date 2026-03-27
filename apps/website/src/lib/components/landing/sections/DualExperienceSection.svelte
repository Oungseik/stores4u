<script lang="ts">
  import BokehParticles from "../BokehParticles.svelte";
  import ScrollReveal from "../ScrollReveal.svelte";

  let activeView = $state<"owner" | "customer">("owner");

  const ownerFeatures = [
    {
      title: "Inventory Management",
      desc: "Track stock levels, receive AI-powered reorder suggestions, and manage suppliers all in one place.",
    },
    {
      title: "Sales Analytics",
      desc: "Real-time insights into your sales performance, popular products, and customer trends.",
    },
    {
      title: "AI Assistant",
      desc: "Your virtual business partner that suggests optimizations, creates content, and automates tasks.",
    },
    {
      title: "Order Management",
      desc: "Process orders, track fulfillment, and communicate with customers seamlessly.",
    },
  ];

  const customerFeatures = [
    {
      title: "Quick QR Access",
      desc: "Customers scan your store QR code to instantly browse your products—no app download required.",
    },
    {
      title: "Easy Product Search",
      desc: "Smart search helps customers find exactly what they need with filters and categories.",
    },
    {
      title: "One-Tap Checkout",
      desc: "Streamlined checkout process with saved payment methods and quick reorder options.",
    },
    {
      title: "Order Tracking",
      desc: "Customers can track their orders in real-time and receive automatic updates.",
    },
  ];
</script>

<section class="relative px-4 py-24 sm:px-6 lg:px-8 xl:px-12">
  <div class="absolute inset-0 z-0">
    <BokehParticles count={60} />
  </div>
  <div class="relative z-10 mx-auto max-w-7xl">
    <!-- Section header -->
    <ScrollReveal>
      <div class="mx-auto mb-12 max-w-3xl text-center">
        <span
          class="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-medium"
        >
          Dual Experience
        </span>
        <h2 class="text-foreground mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
          Built for{" "}
          <span class="from-primary to-chart-2 bg-gradient-to-r bg-clip-text text-transparent">
            both sides
          </span>
        </h2>
        <p class="text-muted-foreground text-lg">
          A seamless experience whether you're managing your store or shopping as a customer.
        </p>
      </div>
    </ScrollReveal>

    <!-- View toggle -->
    <ScrollReveal delay={100}>
      <div class="mb-12 flex justify-center">
        <div class="bg-muted border-border inline-flex rounded-xl border p-1">
          <button
            class="rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200"
            class:bg-card={activeView === "owner"}
            class:text-foreground={activeView === "owner"}
            class:shadow-sm={activeView === "owner"}
            class:text-muted-foreground={activeView !== "owner"}
            class:hover:text-foreground={activeView !== "owner"}
            onclick={() => (activeView = "owner")}
          >
            Store Owner
          </button>
          <button
            class="rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200"
            class:bg-card={activeView === "customer"}
            class:text-foreground={activeView === "customer"}
            class:shadow-sm={activeView === "customer"}
            class:text-muted-foreground={activeView !== "customer"}
            class:hover:text-foreground={activeView !== "customer"}
            onclick={() => (activeView = "customer")}
          >
            Customer
          </button>
        </div>
      </div>
    </ScrollReveal>

    <!-- Content based on active view -->
    <ScrollReveal delay={200}>
      {#if activeView === "owner"}
        <div class="grid items-center gap-12 lg:grid-cols-2">
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
            <div
              class="bg-card border-border relative overflow-hidden rounded-2xl border shadow-2xl"
            >
              <div
                class="from-muted to-background flex aspect-[4/3] items-center justify-center bg-gradient-to-br"
              >
                <div class="p-8 text-center">
                  <div
                    class="from-primary to-chart-2 shadow-primary/20 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br shadow-xl"
                  >
                    <svg
                      class="text-primary-foreground h-12 w-12"
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
                  <h3 class="text-foreground mb-2 text-xl font-semibold">Admin Dashboard</h3>
                  <p class="text-muted-foreground mb-4">Complete store management interface</p>
                  <p class="text-muted-foreground/60 text-sm">
                    Replace with actual dashboard screenshot
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Features list -->
          <div class="order-1 flex flex-col gap-6 lg:order-2">
            <h3 class="text-foreground text-2xl font-bold">
              Everything you need to manage your business
            </h3>

            <div class="flex flex-col gap-4">
              {#each ownerFeatures as feature}
                <div
                  class="bg-card border-border hover:border-primary/30 flex gap-4 rounded-xl border p-4 transition-colors"
                >
                  <div
                    class="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                  >
                    <svg
                      class="text-primary h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-foreground mb-1 font-semibold">{feature.title}</h4>
                    <p class="text-muted-foreground text-sm">{feature.desc}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {:else}
        <div class="grid items-center gap-12 lg:grid-cols-2">
          <!-- Left: Features list -->
          <div class="flex flex-col gap-6">
            <h3 class="text-foreground text-2xl font-bold">
              A seamless shopping experience for your customers
            </h3>

            <div class="flex flex-col gap-4">
              {#each customerFeatures as feature}
                <div
                  class="bg-card border-border hover:border-primary/30 flex gap-4 rounded-xl border p-4 transition-colors"
                >
                  <div
                    class="bg-chart-4/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                  >
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-foreground mb-1 font-semibold">{feature.title}</h4>
                    <p class="text-muted-foreground text-sm">{feature.desc}</p>
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
            <div class="relative mx-auto max-w-sm">
              <!-- Phone frame -->
              <div
                class="bg-card border-border relative overflow-hidden rounded-[3rem] border-8 shadow-2xl"
              >
                <div
                  class="from-muted to-background flex aspect-[9/19] items-center justify-center bg-gradient-to-br"
                >
                  <div class="p-6 text-center">
                    <div
                      class="from-chart-4 to-chart-3 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br"
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
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                    <h3 class="text-foreground mb-1 text-lg font-semibold">Mobile Store</h3>
                    <p class="text-muted-foreground text-sm">Customer shopping experience</p>
                  </div>
                </div>

                <!-- Home indicator -->
                <div
                  class="bg-foreground/20 absolute bottom-2 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full"
                ></div>
              </div>

              <!-- Floating notification -->
              <div
                class="bg-card border-border animate-float-delay absolute -top-4 -right-4 rounded-xl border p-3 shadow-xl"
              >
                <div class="flex items-center gap-2">
                  <div class="bg-chart-4/20 flex h-8 w-8 items-center justify-center rounded-full">
                    <svg
                      class="text-chart-4 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div class="text-xs">
                    <p class="text-foreground font-medium">Order Confirmed!</p>
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
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .animate-float-delay {
    animation: float-delay 3s ease-in-out infinite;
  }
</style>
