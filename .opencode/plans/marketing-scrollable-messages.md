# Plan: Make Messages Scrollable in Marketing Page

## Task
Keep the header, tabs and the message box in place. Only make the messages scrollable in apps/website/src/routes/[slug]/(protected)/admin/marketing/+page.svelte

## Analysis
The current structure has:
- Header with breadcrumb (shrink-0) ✓
- Tabs (shrink-0) ✓
- Message area with ScrollArea (flex-1)
- Message input box (shrink-0) ✓

The ScrollArea needs to have `h-full` class to properly fill the available flex space and enable scrolling within the message container while keeping the header, tabs, and input fixed.

## Change Required
Add `h-full` class to the ScrollArea component on line 204:

```svelte
<ScrollArea class="h-full flex-1">
```

This ensures the ScrollArea takes up the full height of its flex container, allowing messages to scroll while keeping the message input box fixed at the bottom.
