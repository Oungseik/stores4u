<script lang="ts">
  import UserIcon from "@lucide/svelte/icons/user";
  import UsersIcon from "@lucide/svelte/icons/users";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Separator } from "@repo/ui/separator";

  const mockTeam = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "owner" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "manager" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "cashier" },
  ];
</script>

<Card.Root>
  <Card.Header class="flex flex-row items-center justify-between">
    <div>
      <Card.Title class="flex items-center gap-2">
        <UsersIcon class="size-5" />
        Team Members
      </Card.Title>
      <Card.Description>Manage access and permissions</Card.Description>
    </div>
    <Button variant="outline" class="gap-2">
      <UserIcon class="size-4" />
      Invite Member
    </Button>
  </Card.Header>
  <Card.Content>
    <div class="space-y-4">
      {#each mockTeam as member}
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="flex items-center gap-3">
            <div class="bg-muted flex size-10 items-center justify-center rounded-full">
              <UserIcon class="text-muted-foreground size-5" />
            </div>
            <div>
              <p class="font-medium">{member.name}</p>
              <p class="text-muted-foreground text-sm">{member.email}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span
              class="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
            >
              {member.role}
            </span>
            <Button variant="ghost" size="sm">Edit</Button>
          </div>
        </div>
      {/each}
    </div>

    <Separator class="my-6" />

    <div class="rounded-lg border border-dashed p-6 text-center">
      <UsersIcon class="text-muted-foreground mx-auto size-8" />
      <h3 class="mt-2 font-medium">Add team members</h3>
      <p class="text-muted-foreground mt-1 text-sm">Invite colleagues to help manage your shop</p>
      <Button variant="outline" class="mt-4 gap-2">
        <UserIcon class="size-4" />
        Invite Member
      </Button>
    </div>
  </Card.Content>
</Card.Root>
