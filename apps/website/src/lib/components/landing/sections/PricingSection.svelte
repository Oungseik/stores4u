<script lang="ts">
  import ScrollReveal from "../ScrollReveal.svelte";

  const features = [
    "Unlimited products and inventory",
    "AI-powered sales insights",
    "Multi-location support",
    "Barcode scanning & POS",
    "Purchase & supplier management",
    "Team collaboration",
    "Real-time inventory tracking",
    "Automated receipts & tax",
    "24/7 support",
    "Regular feature updates",
  ];
</script>

<section id="pricing" class="relative px-4 py-24 sm:px-6 lg:px-8 xl:px-12">
  <div class="mx-auto max-w-7xl">
    <ScrollReveal>
      <div class="mx-auto mb-16 max-w-3xl text-center">
        <span
          class="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-medium"
        >
          Pricing
        </span>
        <h2 class="text-foreground mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
          Free for
          <span class="from-primary to-chart-2 bg-gradient-to-r bg-clip-text text-transparent">
            everyone
          </span>
        </h2>
        <p class="text-muted-foreground text-lg">
          No credit card required. No hidden fees. Get full access to every feature while we build
          the best store management platform.
        </p>
      </div>
    </ScrollReveal>

    <div class="mx-auto max-w-xl">
      <ScrollReveal>
        <div
          class="from-primary via-chart-2 to-chart-3 relative h-full rounded-2xl bg-gradient-to-br p-[2px]"
        >
          <div class="bg-card h-full rounded-2xl p-8 sm:p-10">
            <div class="mb-6 flex items-center justify-between">
              <span
                class="from-primary to-chart-2 bg-gradient-to-r bg-clip-text text-lg font-semibold text-transparent"
              >
                Everything Included
              </span>
              <span
                class="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold"
              >
                Free
              </span>
            </div>

            <div class="mb-4">
              <span class="text-foreground text-4xl font-bold">$0</span>
              <span class="text-muted-foreground text-sm">/month</span>
            </div>

            <p class="text-muted-foreground mb-8 text-sm">
              We're focused on building the best product. Paid tiers will come later — early users
              may receive special offers.
            </p>

            <ul class="mb-8 grid gap-3 sm:grid-cols-2">
              {#each features as feature}
                <li class="flex items-start gap-3">
                  <svg
                    class="text-primary mt-0.5 h-5 w-5 flex-shrink-0"
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
                  <span class="text-muted-foreground text-sm">{feature}</span>
                </li>
              {/each}
            </ul>

            <a
              href="/signup"
              class="text-primary-foreground bg-primary hover:bg-primary/90 shadow-primary/25 block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold shadow-lg transition-all duration-200 hover:scale-105"
            >
              Get Started for Free
            </a>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </div>
</section>
