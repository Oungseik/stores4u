<script lang="ts">
  import { onMount } from 'svelte';
  
  let mounted = $state(false);
  
  onMount(() => {
    mounted = true;
  });
</script>

<div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
  <!-- Primary gradient orb - top right -->
  <div 
    class="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl transition-opacity duration-1000"
    class:opacity-30={mounted}
    class:opacity-0={!mounted}
    style="background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--chart-2)) 50%, hsl(var(--chart-4)) 100%);"
  ></div>
  
  <!-- Secondary gradient orb - bottom left -->
  <div 
    class="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
    style="background: linear-gradient(225deg, hsl(var(--chart-3)) 0%, hsl(var(--primary)) 100%);"
  ></div>
  
  <!-- Tertiary gradient orb - center -->
  <div 
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-3xl"
    style="background: radial-gradient(circle, hsl(var(--chart-1)) 0%, transparent 70%);"
  ></div>
  
  <!-- Animated gradient mesh -->
  <div class="absolute inset-0 opacity-[0.08]">
    <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" class="text-foreground"/>
    </svg>
  </div>
  
  <!-- Floating particles -->
  <div class="absolute inset-0">
    {#each Array(20) as _, i}
      <div
        class="absolute w-1 h-1 rounded-full bg-primary/20 animate-float"
        style="
          left: {Math.random() * 100}%;
          top: {Math.random() * 100}%;
          animation-duration: {10 + Math.random() * 20}s;
          animation-delay: {Math.random() * 5}s;
        "
      ></div>
    {/each}
  </div>
</div>

<style>
  @keyframes float {
    0%, 100% {
      transform: translateY(0) translateX(0);
      opacity: 0.2;
    }
    25% {
      transform: translateY(-20px) translateX(10px);
      opacity: 0.5;
    }
    50% {
      transform: translateY(-10px) translateX(-10px);
      opacity: 0.3;
    }
    75% {
      transform: translateY(-30px) translateX(5px);
      opacity: 0.4;
    }
  }

  .animate-float {
    animation: float ease-in-out infinite;
  }
</style>
