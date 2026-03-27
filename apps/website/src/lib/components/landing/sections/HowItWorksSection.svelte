<script lang="ts">
  import ScrollReveal from "../ScrollReveal.svelte";

  const steps = [
    {
      number: "01",
      title: "Set Up Your Store",
      description:
        "Create your store in minutes. Add products, set pricing, and configure your business profile. Our AI helps categorize and organize everything.",
      icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </svg>`,
    },
    {
      number: "02",
      title: "Connect & Configure",
      description:
        "Link your social media accounts, set up payment methods, and configure the AI assistant. We support Facebook, TikTok, Viber, Telegram, and more.",
      icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>`,
    },
    {
      number: "03",
      title: "Sell & Grow",
      description:
        "Start accepting orders with QR code checkout. The AI manages inventory, creates social posts, and provides insights to help you grow your business.",
      icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>`,
    },
  ];
</script>

<section id="how-it-works" class="bg-muted/50 px-4 py-24 sm:px-6 lg:px-8 xl:px-12">
  <div class="mx-auto max-w-7xl">
    <!-- Section header -->
    <ScrollReveal>
      <div class="mx-auto mb-16 max-w-3xl text-center">
        <span
          class="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-medium"
        >
          How It Works
        </span>
        <h2 class="text-foreground mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
          Get started in{" "}
          <span class="from-primary to-chart-2 bg-gradient-to-r bg-clip-text text-transparent">
            three simple steps
          </span>
        </h2>
        <p class="text-muted-foreground text-lg">
          From setup to your first sale, our platform makes it easy to launch and manage your online
          store.
        </p>
      </div>
    </ScrollReveal>

    <!-- Steps -->
    <div class="relative">
      <!-- Connection line (desktop only) -->
      <div class="absolute top-24 right-0 left-0 hidden h-0.5 lg:block">
        <div class="relative mx-auto h-full max-w-4xl">
          <div
            class="via-border absolute inset-0 bg-gradient-to-r from-transparent to-transparent"
          ></div>
          <div
            class="from-primary/50 absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r to-transparent"
          ></div>
        </div>
      </div>

      <div class="grid gap-8 md:grid-cols-3 lg:gap-12">
        {#each steps as step, index}
          <ScrollReveal delay={index * 150}>
            <div class="group relative text-center">
              <!-- Step number badge -->
              <div class="relative mb-6 inline-flex h-20 w-20 items-center justify-center">
                <div
                  class="from-primary to-chart-2 absolute inset-0 rounded-2xl bg-gradient-to-br opacity-10 transition-opacity group-hover:opacity-20"
                ></div>
                <div
                  class="bg-card border-primary shadow-primary/10 relative flex h-16 w-16 items-center justify-center rounded-xl border-2 shadow-lg transition-transform duration-300 group-hover:scale-110"
                >
                  <span
                    class="from-primary to-chart-2 bg-gradient-to-br bg-clip-text text-2xl font-bold text-transparent"
                  >
                    {step.number}
                  </span>
                </div>

                <!-- Icon overlay -->
                <div
                  class="bg-primary text-primary-foreground absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-lg shadow-lg"
                >
                  {@html step.icon}
                </div>
              </div>

              <!-- Content -->
              <h3 class="text-foreground mb-3 text-xl font-bold">{step.title}</h3>
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
          class="text-primary-foreground bg-primary hover:bg-primary/90 shadow-primary/25 inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg"
        >
          Start Your Free Trial
          <svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </a>
      </div>
    </ScrollReveal>
  </div>
</section>
