<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    children: import("svelte").Snippet;
    delay?: number;
    class?: string;
  }

  let { children, delay = 0, class: className = "" }: Props = $props();

  let visible = $state(false);
  let element: HTMLElement;

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              visible = true;
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  });
</script>

<div
  bind:this={element}
  class="transition-all duration-700 {className}"
  class:opacity-0={!visible}
  class:translate-y-8={!visible}
  class:opacity-100={visible}
  class:translate-y-0={visible}
>
  {@render children()}
</div>
