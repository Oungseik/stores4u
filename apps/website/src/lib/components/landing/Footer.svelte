<script lang="ts">
  import { siFacebook, siTelegram, siViber } from "simple-icons";
</script>

<footer class="border-border bg-muted/30 border-t px-4 py-16 sm:px-6 lg:px-8 xl:px-12">
  <div class="mx-auto max-w-7xl">
    <div class="mb-12 grid gap-12 md:grid-cols-4">
      <!-- Brand -->
      <div class="md:col-span-1">
        <a href="/" class="mb-4 flex items-center gap-2">
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
        <p class="text-muted-foreground mb-6 text-sm">
          AI-powered store management platform for modern SMEs. Manage inventory, process sales, and
          grow your business.
        </p>
        <!-- Social links -->
        <div class="flex items-center gap-4">
          <a
            href="#"
            class="bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d={siFacebook.path} />
            </svg>
          </a>
          <a
            href="#"
            class="bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d={siViber.path} />
            </svg>
          </a>
          <a
            href="#"
            class="bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d={siTelegram.path} />
            </svg>
          </a>
        </div>
      </div>

      <!-- Product -->
      <div>
        <h3 class="text-foreground mb-4 font-semibold">Product</h3>
        <ul class="flex flex-col gap-3">
          <li>
            <a
              href="#features"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >Features</a
            >
          </li>
          <li>
            <a
              href="#how-it-works"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >How It Works</a
            >
          </li>
          <li>
            <a
              href="/pricing"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >Pricing</a
            >
          </li>
          <li>
            <a
              href="#"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >Changelog</a
            >
          </li>
        </ul>
      </div>

      <!-- Resources -->
      <div>
        <h3 class="text-foreground mb-4 font-semibold">Resources</h3>
        <ul class="flex flex-col gap-3">
          <li>
            <a
              href="#"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >Documentation</a
            >
          </li>
          <li>
            <a
              href="#"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >API Reference</a
            >
          </li>
          <li>
            <a
              href="#"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >Help Center</a
            >
          </li>
          <li>
            <a
              href="#"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors">Blog</a
            >
          </li>
        </ul>
      </div>

      <!-- Company -->
      <div>
        <h3 class="text-foreground mb-4 font-semibold">Company</h3>
        <ul class="flex flex-col gap-3">
          <li>
            <a
              href="#"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >About Us</a
            >
          </li>
          <li>
            <a
              href="#"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >Careers</a
            >
          </li>
          <li>
            <a
              href="#"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >Contact</a
            >
          </li>
          <li>
            <a
              href="#"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >Privacy Policy</a
            >
          </li>
        </ul>
      </div>
    </div>

    <!-- Bottom bar -->
    <div
      class="border-border flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row"
    >
      <p class="text-muted-foreground text-sm">© 2024 Stores4U. All rights reserved.</p>
      <div class="flex items-center gap-6">
        <a href="#" class="text-muted-foreground hover:text-foreground text-sm transition-colors">
          Terms of Service
        </a>
        <a href="#" class="text-muted-foreground hover:text-foreground text-sm transition-colors">
          Privacy Policy
        </a>
        <a href="#" class="text-muted-foreground hover:text-foreground text-sm transition-colors">
          Cookies
        </a>
      </div>
    </div>
  </div>
</footer>
