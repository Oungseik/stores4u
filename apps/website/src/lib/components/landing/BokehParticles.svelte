<script lang="ts">
  interface Particle {
    id: number;
    x: number;
    y: number;
    delay: number;
    duration: number;
  }

  function createParticles(count: number): Particle[] {
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * -20,
        duration: 8 + Math.random() * 12,
      });
    }

    return particles;
  }

  let { count = 200 }: { count?: number } = $props();

  const particles = createParticles(count);
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden">
  <svg
    class="absolute inset-0 h-full w-full"
    preserveAspectRatio="xMidYMid slice"
    viewBox="0 0 100 100"
  >
    {#each particles as particle}
      <circle
        cx={particle.x}
        cy={particle.y}
        r="0.15"
        class="particle"
        style="
          animation-delay: {particle.delay}s;
          animation-duration: {particle.duration}s;
        "
      />
    {/each}
  </svg>
</div>

<style>
  .particle {
    animation-name: float;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    will-change: transform;
  }

  /* Light mode colors */
  :root .particle:nth-child(6n+1) { fill: rgba(255, 120, 140, 0.55); }
  :root .particle:nth-child(6n+2) { fill: rgba(255, 160, 90, 0.55); }
  :root .particle:nth-child(6n+3) { fill: rgba(255, 220, 80, 0.55); }
  :root .particle:nth-child(6n+4) { fill: rgba(100, 210, 140, 0.55); }
  :root .particle:nth-child(6n+5) { fill: rgba(100, 150, 255, 0.55); }
  :root .particle:nth-child(6n+6) { fill: rgba(180, 110, 255, 0.55); }

  /* Dark mode colors */
  :global(.dark) .particle:nth-child(6n+1) { fill: rgba(255, 182, 193, 0.2); }
  :global(.dark) .particle:nth-child(6n+2) { fill: rgba(255, 200, 150, 0.2); }
  :global(.dark) .particle:nth-child(6n+3) { fill: rgba(255, 255, 180, 0.2); }
  :global(.dark) .particle:nth-child(6n+4) { fill: rgba(180, 255, 200, 0.2); }
  :global(.dark) .particle:nth-child(6n+5) { fill: rgba(180, 200, 255, 0.2); }
  :global(.dark) .particle:nth-child(6n+6) { fill: rgba(220, 180, 255, 0.2); }

  @keyframes float {
    0%,
    100% {
      transform: translate(0%, 0%);
    }
    25% {
      transform: translate(1%, -2%);
    }
    50% {
      transform: translate(-1%, -1%);
    }
    75% {
      transform: translate(2%, -1%);
    }
  }
</style>
