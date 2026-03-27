<script lang="ts">
  import BokehParticles from "../BokehParticles.svelte";
  import QRScanner from "../QRScanner.svelte";
  import ScrollReveal from "../ScrollReveal.svelte";
</script>

<section id="features" class="relative px-4 py-24 sm:px-6 lg:px-8 xl:px-12">
  <div class="absolute inset-0 z-0">
    <BokehParticles count={60} />
  </div>
  <div class="relative z-10 mx-auto max-w-7xl">
    <!-- Section header -->
    <ScrollReveal>
      <div class="mx-auto mb-16 max-w-3xl text-center">
        <span
          class="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-medium"
        >
          Features
        </span>
        <h2 class="text-foreground mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
          Everything you need to{" "}
          <span class="from-primary to-chart-2 bg-gradient-to-r bg-clip-text text-transparent">
            run your business
          </span>
        </h2>
        <p class="text-muted-foreground text-lg">
          From inventory management to social media automation, our AI-powered platform handles the
          heavy lifting so you can focus on growing your business.
        </p>
      </div>
    </ScrollReveal>

    <!-- Feature cards grid -->
    <div class="grid gap-6 md:grid-cols-2 lg:gap-8">
      <!-- Feature 1: AI Inventory Scanner -->
      <ScrollReveal delay={0} class="md:row-start-1 md:row-end-2">
        <div
          class="group bg-card border-border hover:border-primary/50 hover:shadow-primary/5 relative rounded-2xl border p-8 transition-all duration-300 hover:shadow-xl"
        >
          <!-- Icon -->
          <div
            class="from-primary to-chart-2 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110"
          >
            <svg
              class="text-primary-foreground h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <h3 class="text-foreground mb-3 text-xl font-bold">Smart Inventory Management</h3>
          <p class="text-muted-foreground mb-6">
            Upload invoices, receipts, or product photos—our AI automatically extracts and updates
            your inventory. No manual data entry needed.
          </p>

          <!-- Visual demo -->
          <div class="bg-muted relative overflow-hidden rounded-xl p-4">
            <!-- 
              PLACEHOLDER IMAGE
              Dimensions: 400x200px
              Type: Process Illustration
              Description: Three-step visual showing invoice upload -> AI processing -> inventory updated
              Style: Clean icons or illustrations showing document scanning and database update
            -->
            <div class="flex items-center justify-between gap-2">
              <div class="bg-card border-border flex-1 rounded-lg border p-3 text-center">
                <svg
                  class="text-muted-foreground mx-auto mb-2 h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p class="text-muted-foreground text-xs">Upload Invoice</p>
              </div>
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
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
              <div class="bg-primary/5 border-primary/20 flex-1 rounded-lg border p-3 text-center">
                <svg
                  class="text-primary mx-auto mb-2 h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <p class="text-primary text-xs">AI Processing</p>
              </div>
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
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
              <div class="bg-card border-border flex-1 rounded-lg border p-3 text-center">
                <svg
                  class="text-chart-4 mx-auto mb-2 h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <p class="text-muted-foreground text-xs">Stock Updated</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <!-- Feature 2: QR Checkout -->
      <ScrollReveal delay={100} class="md:row-start-1 md:row-end-3">
        <div
          class="group bg-card border-border hover:border-primary/50 hover:shadow-primary/5 relative rounded-2xl border p-8 transition-all duration-300 hover:shadow-xl"
        >
          <!-- Icon -->
          <div
            class="from-chart-3 to-chart-4 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110"
          >
            <svg
              class="text-primary-foreground h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>

          <h3 class="text-foreground mb-3 text-xl font-bold">One-Tap QR Checkout</h3>
          <p class="text-muted-foreground mb-6">
            Customers scan a QR code to view your store, browse products, and complete purchases in
            seconds. No app downloads required.
          </p>

          <!-- Visual demo -->
          <div class="bg-muted relative overflow-hidden rounded-xl p-6">
            <QRScanner />
          </div>
        </div>
      </ScrollReveal>

      <!-- Feature 3: AI Content Assistant -->
      <ScrollReveal delay={300} class="md:row-start-2 md:row-end-4">
        <div
          class="group bg-card border-border hover:border-primary/50 hover:shadow-primary/5 relative rounded-2xl border p-8 transition-all duration-300 hover:shadow-xl"
        >
          <!-- Icon -->
          <div
            class="from-chart-4 to-chart-5 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110"
          >
            <svg
              class="text-primary-foreground h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>

          <h3 class="text-foreground mb-3 text-xl font-bold">AI Content Creation</h3>
          <p class="text-muted-foreground mb-6">
            Generate compelling product descriptions, marketing posts, and promotional content
            instantly. Our AI understands your brand voice and audience.
          </p>

          <!-- Visual demo -->
          <div class="bg-muted relative overflow-hidden rounded-xl p-4">
            <!-- 
              PLACEHOLDER IMAGE
              Dimensions: 400x150px
              Type: UI Mockup
              Description: Chat interface showing AI generating content for a product post
              Style: Chat bubble interface with AI avatar and generated text
            -->
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <div
                  class="bg-primary/20 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                >
                  <svg
                    class="text-primary h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="bg-card border-border rounded-lg rounded-tl-none border p-3">
                    <p class="text-muted-foreground text-sm">
                      Create a promotional post for my new wireless headphones
                    </p>
                  </div>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex-1">
                  <div
                    class="bg-primary/10 border-primary/20 rounded-lg rounded-tr-none border p-3"
                  >
                    <p class="text-foreground animate-pulse text-sm">
                      🎧 Just arrived! Experience crystal-clear sound with our new Wireless Pro
                      headphones. 30-hour battery, active noise cancellation, and premium comfort... <span
                        class="text-primary">✨ Generating...</span
                      >
                    </p>
                  </div>
                </div>
                <div
                  class="bg-chart-4/20 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                >
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <!-- Feature 4: Social Media Integration -->
      <ScrollReveal delay={200} class="md:row-start-3 md:row-end-4">
        <div
          class="group bg-card border-border hover:border-primary/50 hover:shadow-primary/5 relative rounded-2xl border p-8 transition-all duration-300 hover:shadow-xl"
        >
          <!-- Icon -->
          <div
            class="from-chart-2 to-chart-3 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110"
          >
            <svg
              class="text-primary-foreground h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </div>

          <h3 class="text-foreground mb-3 text-xl font-bold">Social Media Command Center</h3>
          <p class="text-muted-foreground mb-6">
            Connect Facebook, TikTok, Viber, and Telegram. Create and schedule posts across all
            platforms from one dashboard with AI-generated content.
          </p>

          <!-- Platform icons -->
          <div class="flex items-center gap-4">
            <!-- Facebook -->
            <div
              class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-[#1877F2]/10 transition-transform hover:scale-110"
            >
              <svg class="h-6 w-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </div>
            <!-- TikTok -->
            <div
              class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-black/10 transition-transform hover:scale-110 dark:bg-white/10"
            >
              <svg class="text-foreground h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
                />
              </svg>
            </div>
            <!-- Viber -->
            <div
              class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-[#7360f2]/10 transition-transform hover:scale-110"
            >
              <svg class="h-6 w-6 text-[#7360f2]" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M11.809 0c-1.395 0-2.813.102-4.116.31-3.202.514-6.17 2.15-7.85 4.52C.93 6.38.109 9.03.005 12.096c-.06 1.78.353 3.52 1.103 5.106.983 2.06 2.546 3.67 4.46 4.567.806.368 1.692.605 2.59.694.217.022.435.033.652.033h.013c.024 0 .024-.014.032-.03.172-.48.335-.964.503-1.446.033-.093.017-.114-.078-.14-.52-.143-1.024-.34-1.5-.583-1.89-.984-3.16-2.53-3.803-4.485-.604-1.838-.542-3.79.18-5.574.947-2.26 2.75-3.96 5.066-4.778 1.858-.64 3.85-.76 5.784-.35 2.35.5 4.356 1.79 5.692 3.64 1.054 1.463 1.58 3.178 1.53 4.93-.046 1.554-.475 3.03-1.25 4.342-1.127 1.92-2.87 3.288-4.99 3.897-.15.045-.302.084-.45.138-.076.028-.106.007-.13-.066-.21-.627-.416-1.255-.625-1.88-.03-.087-.007-.115.077-.143.874-.296 1.67-.746 2.36-1.33 1.42-1.217 2.26-2.85 2.44-4.714.16-1.635-.29-3.178-1.26-4.5-1.11-1.51-2.68-2.5-4.54-2.87-1.29-.257-2.59-.246-3.87.03-1.93.42-3.57 1.37-4.77 2.78-.864.99-1.35 2.15-1.43 3.42-.08 1.2.17 2.34.72 3.4.58 1.11 1.43 1.99 2.48 2.59.55.32 1.14.56 1.76.72.08.02.1.05.08.13-.18.574-.35 1.15-.52 1.725l-.02.07c-.02.06-.05.08-.12.07-1.16-.15-2.28-.45-3.33-.94-1.63-.76-3-1.87-4.02-3.25-1.09-1.47-1.76-3.15-1.98-4.97-.15-1.26-.06-2.53.27-3.75.62-2.35 2.02-4.35 4.1-5.8C5.35 1.63 7.69.64 10.21.25c.48-.08.97-.13 1.46-.17h.14z"
                />
              </svg>
            </div>
            <!-- Telegram -->
            <div
              class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-[#0088cc]/10 transition-transform hover:scale-110"
            >
              <svg class="h-6 w-6 text-[#0088cc]" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.692-1.653-1.123-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.062 3.345-.48.33-.913.49-1.303.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
                />
              </svg>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </div>
</section>
