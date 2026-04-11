<script lang="ts">
  import AnimatedBackground from "./AnimatedBackground.svelte";
  import Footer from "./Footer.svelte";
  import Navigation from "./Navigation.svelte";
  import CTASection from "./sections/CTASection.svelte";
  import DualExperienceSection from "./sections/DualExperienceSection.svelte";
  import FeaturesSection from "./sections/FeaturesSection.svelte";
  import HeroSection from "./sections/HeroSection.svelte";
  import HowItWorksSection from "./sections/HowItWorksSection.svelte";
  import PricingSection from "./sections/PricingSection.svelte";
</script>

<div class="relative min-h-screen">
  <!-- Animated background -->
  <AnimatedBackground />

  <!-- Navigation -->
  <Navigation />

  <!-- Main content -->
  <main class="pt-20">
    <HeroSection />
    <FeaturesSection />
    <HowItWorksSection />
    <DualExperienceSection />
    <PricingSection />
    <CTASection />
  </main>

  <!-- Footer -->
  <Footer />
</div>
