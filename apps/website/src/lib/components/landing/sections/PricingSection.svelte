<script lang="ts">
  import ScrollReveal from "../ScrollReveal.svelte";

  const tiers = [
    {
      name: "Starter",
      price: "Free",
      period: "",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
      features: [
        "Lorem ipsum dolor sit amet",
        "Consectetur adipiscing elit",
        "Sed do eiusmod tempor incididunt",
        "Ut labore et dolore magna aliqua",
      ],
      cta: "Get Started",
      href: "/signup",
      featured: false,
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation.",
      features: [
        "Everything in Starter, plus",
        "Ut enim ad minim veniam",
        "Quis nostrud exercitation ullamco",
        "Laboris nisi ut aliquip ex ea commodo",
        "Duis aute irure dolor in reprehenderit",
      ],
      cta: "Start Free Trial",
      href: "/signup",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "$79",
      period: "/month",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident.",
      features: [
        "Everything in Professional, plus",
        "Excepteur sint occaecat cupidatat",
        "Non proident, sunt in culpa",
        "Qui officia deserunt mollit anim",
        "Sed ut perspiciatis unde omnis",
        "Nemo enim ipsam voluptatem",
      ],
      cta: "Contact Sales",
      href: "/signup",
      featured: false,
    },
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
          Simple, transparent
          <span class="from-primary to-chart-2 bg-gradient-to-r bg-clip-text text-transparent">
            pricing
          </span>
        </h2>
        <p class="text-muted-foreground text-lg">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Maecenas
          consectetur libero vel scelerisque.
        </p>
      </div>
    </ScrollReveal>

    <div class="grid gap-8 md:grid-cols-3 lg:gap-6">
      {#each tiers as tier, index}
        <ScrollReveal delay={index * 100}>
          <div class="h-full">
            {#if tier.featured}
              <div
                class="from-primary via-chart-2 to-chart-3 relative h-full rounded-2xl bg-gradient-to-br p-[2px]"
              >
                <div class="bg-card h-full rounded-2xl p-8">
                  <div class="mb-6 flex items-center justify-between">
                    <span
                      class="from-primary to-chart-2 bg-gradient-to-r bg-clip-text text-sm font-semibold text-transparent"
                    >
                      {tier.name}
                    </span>
                    <span
                      class="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold"
                    >
                      Most Popular
                    </span>
                  </div>

                  <div class="mb-4">
                    <span class="text-foreground text-4xl font-bold">{tier.price}</span>
                    {#if tier.period}
                      <span class="text-muted-foreground text-sm">{tier.period}</span>
                    {/if}
                  </div>

                  <p class="text-muted-foreground mb-8 text-sm">{tier.description}</p>

                  <ul class="mb-8 space-y-3">
                    {#each tier.features as feature}
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
                    href={tier.href}
                    class="text-primary-foreground bg-primary hover:bg-primary/90 shadow-primary/25 block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    {tier.cta}
                  </a>
                </div>
              </div>
            {:else}
              <div
                class="group bg-card border-border hover:border-primary/50 hover:shadow-primary/5 h-full rounded-2xl border p-8 transition-all duration-300 hover:shadow-xl"
              >
                <span class="text-foreground mb-6 block text-sm font-semibold">{tier.name}</span>

                <div class="mb-4">
                  <span class="text-foreground text-4xl font-bold">{tier.price}</span>
                  {#if tier.period}
                    <span class="text-muted-foreground text-sm">{tier.period}</span>
                  {/if}
                </div>

                <p class="text-muted-foreground mb-8 text-sm">{tier.description}</p>

                <ul class="mb-8 space-y-3">
                  {#each tier.features as feature}
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
                  href={tier.href}
                  class="border-border text-foreground hover:bg-muted block w-full rounded-xl border px-6 py-3 text-center text-sm font-semibold transition-all duration-200"
                >
                  {tier.cta}
                </a>
              </div>
            {/if}
          </div>
        </ScrollReveal>
      {/each}
    </div>
  </div>
</section>
