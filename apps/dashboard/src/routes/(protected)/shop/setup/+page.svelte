<script lang="ts">
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import Loader2Icon from "@lucide/svelte/icons/loader-2";
	import { COUNTRIES, type CountryCode } from "@repo/config";
	import { Button } from "@repo/ui/button";
	import * as Card from "@repo/ui/card";
	import { Input } from "@repo/ui/input";
	import { Label } from "@repo/ui/label";
	import { PhoneInput } from "@repo/ui/phone-input";
	import * as Select from "@repo/ui/select";
	import { Textarea } from "@repo/ui/textarea";
	import { createForm } from "@tanstack/svelte-form";
	import { toast } from "svelte-sonner";
	import z from "zod";

	import { goto } from "$app/navigation";
	import SetupChatWidget from "$lib/components/SetupChatWidget.svelte";
	import { createShop } from "$lib/remote/shops/create_shop.remote";
	import { actionResultSchema, type ShopFormFields } from "$lib/types/shop";
	import { getCountryName } from "$lib/utils";

	let currentStep = $state(1);
	const totalSteps = 2;
	let isSubmitting = $state(false);

	// Per-field Zod schemas shared between inline field validators and step-level validation
	const nameField = z.string().min(1, "Shop name is required").max(100);
	const slugField = z
		.string()
		.min(1, "Slug is required")
		.max(100)
		.regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens");
	const titleField = z.string().max(200).optional();
	const descriptionField = z.string().max(1000).optional();
	const addressField = z.string().min(1, "Address is required").max(200);
	const cityField = z.string().min(1, "City is required").max(100);
	const phoneField = z.string().min(1, "Phone is required").max(50);
	const emailField = z.string().email("Invalid email").max(200).optional().or(z.literal(""));
	const stateField = z.string().max(100).optional();
	const zipCodeField = z.string().max(20).optional();
	const countryField = z.string().min(1, "Country is required");

	const step1Schema = z.object({
		name: nameField,
		slug: slugField,
		title: titleField,
		description: descriptionField,
	});

	const step2Schema = z.object({
		address: addressField,
		city: cityField,
		phone: phoneField,
		email: emailField,
		state: stateField,
		zipCode: zipCodeField,
		country: countryField,
	});

	const shopForm = createForm(() => ({
		defaultValues: {
			name: "",
			slug: "",
			title: "",
			description: "",
			address: "",
			city: "",
			phone: "",
			email: "",
			state: "",
			zipCode: "",
			country: "" as CountryCode | "",
		},
		onSubmit: async ({ value }) => {
			isSubmitting = true;
			try {
				const formData = new FormData();
				formData.append("name", value.name);
				formData.append("slug", value.slug);
				if (value.title) formData.append("title", value.title);
				if (value.description) formData.append("description", value.description);
				formData.append("address", value.address);
				formData.append("city", value.city);
				formData.append("phone", value.phone);
				if (value.email) formData.append("email", value.email);
				if (value.state) formData.append("state", value.state);
				if (value.zipCode) formData.append("zipCode", value.zipCode);
				if (value.country) formData.append("country", value.country);

				const response = await fetch(createShop.action, {
					method: "POST",
					body: formData,
				});

				const parsed = actionResultSchema.safeParse(await response.json());
				if (!parsed.success) {
					toast.error("Invalid response from server.");
					return;
				}
				const result = parsed.data;

				if (result.data?.success && result.data.slug) {
					toast.success("Shop created successfully!");
					goto(`/shop/${result.data.slug}`);
				} else {
					toast.error(result.data?.message || "Failed to create shop.");
				}
			} catch {
				toast.error("Failed to create shop. Please try again.");
			} finally {
				isSubmitting = false;
			}
		},
	}));

	function generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
	}

	function handleNameChange(nameValue: string) {
		shopForm.setFieldValue("slug", generateSlug(nameValue));
	}

	function handleAiFill(fields: ShopFormFields) {
		shopForm.setFieldValue("name", fields.name);
		shopForm.setFieldValue("slug", fields.slug || generateSlug(fields.name));
		if (fields.title) shopForm.setFieldValue("title", fields.title);
		if (fields.description) shopForm.setFieldValue("description", fields.description);
		shopForm.setFieldValue("address", fields.address);
		shopForm.setFieldValue("city", fields.city);
		shopForm.setFieldValue("phone", fields.phone);
		if (fields.email) shopForm.setFieldValue("email", fields.email);
		if (fields.state) shopForm.setFieldValue("state", fields.state);
		if (fields.zipCode) shopForm.setFieldValue("zipCode", fields.zipCode);
		if (fields.country) shopForm.setFieldValue("country", fields.country);
		currentStep = 2;
	}

	function validateStep(step: number): boolean {
		const values = shopForm.state.values;

		if (step === 1) {
			const result = step1Schema.safeParse({
				name: values.name,
				slug: values.slug,
				title: values.title,
				description: values.description,
			});
			shopForm.validateAllFields("change");
			return result.success;
		}

		const result = step2Schema.safeParse({
			address: values.address,
			city: values.city,
			phone: values.phone,
			email: values.email,
			state: values.state,
			zipCode: values.zipCode,
			country: values.country,
		});
		return result.success;
	}

	function nextStep() {
		if (validateStep(currentStep)) {
			currentStep = Math.min(currentStep + 1, totalSteps);
		}
	}

	function prevStep() {
		currentStep = Math.max(currentStep - 1, 1);
	}

	const stepConfig = [
		{
			title: "Shop Identity",
			description: "Tell us about your shop (you can edit later in settings)",
		},
		{
			title: "Contact Information",
			description: "How can customers reach you?",
		},
	];

	const currentStepConfig = $derived(stepConfig[currentStep - 1]);
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
	<div class="flex w-full max-w-lg flex-col gap-6">
		<Card.Root>
			<Card.Header class="text-center">
				<Card.Title class="text-xl">{currentStepConfig.title}</Card.Title>
				<Card.Description>{currentStepConfig.description}</Card.Description>
			</Card.Header>
			<Card.Content>
				<form
					class="space-y-6"
					{...createShop}
					onsubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						shopForm.handleSubmit();
					}}
				>
					{#if currentStep === 1}
						<div class="space-y-4">
							<shopForm.Field
								name="name"
								validators={{
									onChange: ({ value }) =>
										nameField.safeParse(value).error?.issues.at(0)?.message,
								}}
							>
								{#snippet children(field)}
									<div class="space-y-2">
										<Label for={field.name}>Shop Name *</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											type="text"
											onblur={field.handleBlur}
											onchange={(e) => {
												const v = e.currentTarget.value;
												field.handleChange(v);
												handleNameChange(v);
											}}
											placeholder="My Awesome Shop"
											required
										/>
										{#if field.state.meta.errors.length}
											<p class="text-sm text-red-500">{field.state.meta.errors}</p>
										{/if}
									</div>
								{/snippet}
							</shopForm.Field>

							<shopForm.Field
								name="slug"
								validators={{
									onChange: ({ value }) =>
										slugField.safeParse(value).error?.issues.at(0)?.message,
								}}
							>
								{#snippet children(field)}
									<div class="space-y-2">
										<Label for={field.name}>Slug *</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											type="text"
											onblur={field.handleBlur}
											onchange={(e) => field.handleChange(e.currentTarget.value)}
											placeholder="my-awesome-shop"
											required
										/>
										<p class="text-xs text-muted-foreground">Used in your shop URL</p>
										{#if field.state.meta.errors.length}
											<p class="text-sm text-red-500">{field.state.meta.errors}</p>
										{/if}
									</div>
								{/snippet}
							</shopForm.Field>

							<shopForm.Field
								name="title"
								validators={{
									onChange: ({ value }) =>
										titleField.safeParse(value).error?.issues.at(0)?.message,
								}}
							>
								{#snippet children(field)}
									<div class="space-y-2">
										<Label for={field.name}>Shop Title</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											type="text"
											onblur={field.handleBlur}
											onchange={(e) => field.handleChange(e.currentTarget.value)}
											placeholder="My Awesome Shop - Best Products in Town"
										/>
										<p class="text-xs text-muted-foreground">
											Display title shown on your shop page
										</p>
										{#if field.state.meta.errors.length}
											<p class="text-sm text-red-500">{field.state.meta.errors}</p>
										{/if}
									</div>
								{/snippet}
							</shopForm.Field>

							<shopForm.Field
								name="description"
								validators={{
									onChange: ({ value }) =>
										descriptionField.safeParse(value).error?.issues.at(0)?.message,
								}}
							>
								{#snippet children(field)}
									<div class="space-y-2">
										<Label for={field.name}>Description</Label>
										<Textarea
											id={field.name}
											name={field.name}
											value={field.state.value}
											onblur={field.handleBlur}
											onchange={(e) => field.handleChange(e.currentTarget.value)}
											placeholder="Tell customers about your shop..."
											rows={3}
										/>
										{#if field.state.meta.errors.length}
											<p class="text-sm text-red-500">{field.state.meta.errors}</p>
										{/if}
									</div>
								{/snippet}
							</shopForm.Field>
						</div>
					{:else if currentStep === 2}
						<div class="space-y-4">
							<shopForm.Field
								name="address"
								validators={{
									onChange: ({ value }) =>
										addressField.safeParse(value).error?.issues.at(0)?.message,
								}}
							>
								{#snippet children(field)}
									<div class="space-y-2">
										<Label for={field.name}>Address *</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											type="text"
											onblur={field.handleBlur}
											onchange={(e) => field.handleChange(e.currentTarget.value)}
											placeholder="123 Main Street"
											required
										/>
										{#if field.state.meta.errors.length}
											<p class="text-sm text-red-500">{field.state.meta.errors}</p>
										{/if}
									</div>
								{/snippet}
							</shopForm.Field>

							<shopForm.Field
								name="city"
								validators={{
									onChange: ({ value }) =>
										cityField.safeParse(value).error?.issues.at(0)?.message,
								}}
							>
								{#snippet children(field)}
									<div class="space-y-2">
										<Label for={field.name}>City *</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											type="text"
											onblur={field.handleBlur}
											onchange={(e) => field.handleChange(e.currentTarget.value)}
											placeholder="New York"
											required
										/>
										{#if field.state.meta.errors.length}
											<p class="text-sm text-red-500">{field.state.meta.errors}</p>
										{/if}
									</div>
								{/snippet}
							</shopForm.Field>

							<shopForm.Field
								name="phone"
								validators={{
									onChange: ({ value }) =>
										phoneField.safeParse(value).error?.issues.at(0)?.message,
								}}
							>
								{#snippet children(field)}
									<div class="space-y-2">
										<Label for={field.name}>Phone *</Label>
										<PhoneInput
											bind:value={field.state.value}
											name={field.name}
											placeholder="+1 234 567 8900"
											onchange={(e) => {
												field.handleChange(e.currentTarget.value);
											}}
										/>
										{#if field.state.meta.errors.length}
											<p class="text-sm text-red-500">{field.state.meta.errors}</p>
										{/if}
									</div>
								{/snippet}
							</shopForm.Field>

							<shopForm.Field name="email">
								{#snippet children(field)}
									<div class="space-y-2">
										<Label for={field.name}>Email</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											type="email"
											onblur={field.handleBlur}
											onchange={(e) => field.handleChange(e.currentTarget.value)}
											placeholder="hello@yourshop.com"
										/>
									</div>
								{/snippet}
							</shopForm.Field>

							<div class="grid grid-cols-2 gap-4">
								<shopForm.Field name="state">
									{#snippet children(field)}
										<div class="space-y-2">
											<Label for={field.name}>State</Label>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												type="text"
												onblur={field.handleBlur}
												onchange={(e) => field.handleChange(e.currentTarget.value)}
												placeholder="NY"
											/>
										</div>
									{/snippet}
								</shopForm.Field>

								<shopForm.Field name="zipCode">
									{#snippet children(field)}
										<div class="space-y-2">
											<Label for={field.name}>ZIP Code</Label>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												type="text"
												onblur={field.handleBlur}
												onchange={(e) => field.handleChange(e.currentTarget.value)}
												placeholder="10001"
											/>
										</div>
									{/snippet}
								</shopForm.Field>
							</div>

							<shopForm.Field
								name="country"
								validators={{
									onChange: ({ value }) =>
										countryField.safeParse(value).error?.issues.at(0)?.message,
								}}
							>
								{#snippet children(field)}
									<div class="space-y-2">
										<Label for={field.name}>Country *</Label>
										<Select.Root
											value={field.state.value}
											type="single"
											onValueChange={(value) => field.setValue(value as CountryCode)}
										>
											<Select.Trigger class="w-full">
												<span data-slot="select-value">
													{field.state.value
														? getCountryName(field.state.value as CountryCode)
														: "Select a country"}
												</span>
											</Select.Trigger>
											<Select.Content>
												{#each COUNTRIES as countryCode}
													<Select.Item value={countryCode}>
														{getCountryName(countryCode)}
													</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
										{#if field.state.meta.errors.length}
											<p class="text-sm text-red-500">{field.state.meta.errors}</p>
										{/if}
									</div>
								{/snippet}
							</shopForm.Field>
						</div>
					{/if}

					<div class="flex gap-3 pt-4">
						{#if currentStep > 1}
							<Button type="button" variant="outline" onclick={prevStep} class="flex-1">
								<ChevronLeftIcon class="size-4" />
								Previous
							</Button>
						{/if}

						{#if currentStep < totalSteps}
							<Button type="button" onclick={nextStep} class="flex-1">
								Next
								<ChevronRightIcon class="size-4" />
							</Button>
						{:else}
							<Button disabled={isSubmitting} type="submit" class="flex-1">
								{#if isSubmitting}
									<Loader2Icon class="animate-spin" />
								{:else}
									Create Shop
								{/if}
							</Button>
						{/if}
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<p class="text-center text-sm text-muted-foreground">
			Step {currentStep} of {totalSteps}
		</p>
	</div>
</div>

<SetupChatWidget onFill={handleAiFill} />
