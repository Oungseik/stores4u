<script lang="ts">
  interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    delay: number;
    duration: number;
  }

  // Rainbow colors
  const colors = [
    "rgba(255, 182, 193, 0.2)", // Soft pink
    "rgba(255, 200, 150, 0.2)", // Soft orange
    "rgba(255, 255, 180, 0.2)", // Soft yellow
    "rgba(180, 255, 200, 0.2)", // Soft mint
    "rgba(180, 200, 255, 0.2)", // Soft sky
    "rgba(220, 180, 255, 0.2)", // Soft lavender
  ];

  // Create dense particles across entire section
  function createParticles(count: number): Particle[] {
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100, // Random position 0-100%
        y: Math.random() * 100, // Random position 0-100%
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * -20, // Negative delay so they start at different positions
        duration: 8 + Math.random() * 12, // 8-20s
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
        fill={particle.color}
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
