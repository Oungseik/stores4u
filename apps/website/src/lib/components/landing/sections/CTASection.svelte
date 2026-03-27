<script lang="ts">
  import ScrollReveal from "../ScrollReveal.svelte";
</script>

<section class="px-4 py-24 sm:px-6 lg:px-8 xl:px-12">
  <div class="mx-auto max-w-5xl">
    <ScrollReveal>
      <div
        class="from-primary via-chart-2 to-chart-3 relative overflow-hidden rounded-3xl bg-gradient-to-br p-8 sm:p-12 lg:p-16"
      >
        <!-- Content -->
        <div class="relative text-center">
          <h2 class="text-primary-foreground mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Ready to supercharge your store?
          </h2>
          <p class="text-primary-foreground/80 mx-auto mb-10 max-w-2xl text-lg sm:text-xl">
            Join thousands of SMEs already using our AI-powered platform to grow their business.
            Start your free trial today.
          </p>

          <div class="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/signup"
              class="text-primary bg-primary-foreground hover:bg-primary-foreground/90 inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold shadow-xl shadow-black/20 transition-all duration-200 hover:scale-105"
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
              href="/signin"
              class="text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10 inline-flex items-center justify-center rounded-xl border-2 px-8 py-4 text-base font-semibold transition-all duration-200"
            >
              Sign In
            </a>
          </div>

          <!-- Trust indicators -->
          <div
            class="text-primary-foreground/70 mt-10 flex flex-wrap items-center justify-center gap-6 text-sm"
          >
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>Secure & Reliable</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>24/7 Support</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  </div>
</section>
