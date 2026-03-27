<script lang="ts">
  let scrolled = $state(false);
  let mobileMenuOpen = $state(false);
</script>

<svelte:window onscroll={() => (scrolled = window.scrollY > 50)} />

<nav
  class={[
    "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
    scrolled && "bg-background/80 border-border border-b py-3 backdrop-blur-xl",
    !scrolled && "py-4",
  ]}
>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-0">
    <div class="flex items-center justify-between">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2">
        <div
          class="from-primary to-chart-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br"
        >
          <svg
            class="text-primary-foreground h-6 w-6"
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
        <span class="text-foreground text-xl font-bold">Stores4U</span>
      </a>

      <!-- Desktop Navigation -->
      <div class="hidden items-center gap-8 md:flex">
        <a
          href="#features"
          class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Features
        </a>
        <a
          href="#how-it-works"
          class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          How It Works
        </a>
        <a
          href="/pricing"
          class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Pricing
        </a>
      </div>

      <!-- Desktop CTAs -->
      <div class="hidden items-center gap-4 md:flex">
        <a
          href="/signin"
          class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Sign In
        </a>
        <a
          href="/signup"
          class="text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-105"
        >
          Get Started
        </a>
      </div>

      <!-- Mobile menu button -->
      <button
        class="hover:bg-muted rounded-lg p-2 transition-colors md:hidden"
        onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
      >
        <svg class="text-foreground h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {#if mobileMenuOpen}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          {:else}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          {/if}
        </svg>
      </button>
    </div>

    <!-- Mobile menu -->
    {#if mobileMenuOpen}
      <div class="border-border mt-4 border-t pb-4 md:hidden">
        <div class="flex flex-col gap-4 pt-4">
          <a
            href="#features"
            class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            How It Works
          </a>
          <a
            href="/pricing"
            class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Pricing
          </a>
          <div class="border-border flex flex-col gap-3 border-t pt-4">
            <a
              href="/signin"
              class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Sign In
            </a>
            <a
              href="/signup"
              class="text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg px-5 py-2.5 text-center text-sm font-semibold transition-all duration-200"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
</nav>
