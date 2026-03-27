<script lang="ts">
  import { onMount } from 'svelte';
  
  let scanning = $state(true);
  
  onMount(() => {
    const interval = setInterval(() => {
      scanning = !scanning;
    }, 2000);
    
    return () => clearInterval(interval);
  });
</script>

<div class="relative w-48 h-48 mx-auto">
  <!-- QR Code Pattern -->
  <svg class="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Outer corners -->
    <rect x="10" y="10" width="25" height="25" rx="2" stroke="currentColor" stroke-width="4" fill="none" class="text-foreground"/>
    <rect x="65" y="10" width="25" height="25" rx="2" stroke="currentColor" stroke-width="4" fill="none" class="text-foreground"/>
    <rect x="10" y="65" width="25" height="25" rx="2" stroke="currentColor" stroke-width="4" fill="none" class="text-foreground"/>
    
    <!-- Inner corner squares -->
    <rect x="15" y="15" width="15" height="15" fill="currentColor" class="text-foreground"/>
    <rect x="70" y="15" width="15" height="15" fill="currentColor" class="text-foreground"/>
    <rect x="15" y="70" width="15" height="15" fill="currentColor" class="text-foreground"/>
    
    <!-- Data modules -->
    <rect x="42" y="10" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    <rect x="10" y="42" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    <rect x="42" y="42" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    <rect x="55" y="42" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    <rect x="68" y="42" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    <rect x="42" y="55" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    <rect x="55" y="55" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    <rect x="42" y="68" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    <rect x="55" y="68" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    <rect x="68" y="68" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    <rect x="81" y="68" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    <rect x="68" y="81" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    <rect x="81" y="81" width="8" height="8" rx="1" fill="currentColor" class="text-foreground"/>
    
    <!-- Center logo area -->
    <circle cx="50" cy="50" r="8" fill="hsl(var(--primary))"/>
  </svg>
  
  <!-- Scanning line -->
  <div
    class="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-lg"
    style="top: {scanning ? '85%' : '15%'}; transition: top 1s ease-in-out;"
  ></div>
  
  <!-- Corner brackets -->
  <div class="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
  <div class="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
  <div class="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
  <div class="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
</div>
