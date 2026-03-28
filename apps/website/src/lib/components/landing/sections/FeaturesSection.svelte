<script lang="ts">
  import { siFacebook, siTelegram, siTiktok, siViber } from "simple-icons";

  import BarcodeScanner from "../BarcodeScanner.svelte";
  import BokehParticles from "../BokehParticles.svelte";
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
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 12v4M11 12v4M15 12v4"
              />
            </svg>
          </div>

          <h3 class="text-foreground mb-3 text-xl font-bold">Mobile Barcode Scanner</h3>
          <p class="text-muted-foreground mb-6">
            Scan product barcodes with your phone camera to add items and complete sales instantly.
            No expensive POS hardware needed—just your phone.
          </p>

          <!-- Visual demo -->
          <div class="bg-muted relative overflow-hidden rounded-xl p-6">
            <BarcodeScanner />
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
            <div class="flex flex-col gap-3">
              <div class="flex items-start gap-3">
                <div class="flex-1">
                  <div class="bg-card border-border rounded-lg rounded-tr-none border p-3">
                    <p class="text-muted-foreground text-sm">
                      Create a promotional post for my new wireless headphones
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
                  <div
                    class="bg-primary/10 border-primary/20 rounded-lg rounded-tl-none border p-3"
                  >
                    <p class="text-foreground animate-pulse text-sm">
                      🎧 Just arrived! Experience crystal-clear sound with our new Wireless Pro
                      headphones. 30-hour battery, active noise cancellation, and premium comfort... <span
                        class="text-primary">✨ Generating...</span
                      >
                    </p>
                  </div>
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
              <svg class="h-6 w-6 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d={siFacebook.path} />
              </svg>
            </div>
            <!-- TikTok -->
            <div
              class="bg-muted text-foreground flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl transition-transform hover:scale-110"
            >
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d={siTiktok.path} />
              </svg>
            </div>
            <!-- Viber -->
            <div
              class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-[#7360f2]/10 transition-transform hover:scale-110"
            >
              <svg class="h-6 w-6 text-[#7360f2]" viewBox="0 0 24 24" fill="currentColor">
                <path d={siViber.path} />
              </svg>
            </div>
            <!-- Telegram -->
            <div
              class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-[#0088cc]/10 transition-transform hover:scale-110"
            >
              <svg class="h-6 w-6 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                <path d={siTelegram.path} />
              </svg>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </div>
</section>
