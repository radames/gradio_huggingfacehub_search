<script lang="ts">
	type Size = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

	export let author: {
		avatarUrl: string;
		type: string;
	};
	export let classNames = "";
	export let size: Size = "md";

	const SIZE_CLASS: Record<Size, string> = {
		xs: "w-2.5 h-2.5",
		sm: "w-3 h-3",
		md: "w-3.5 h-3.5",
		lg: "w-5 h-5",
		xl: "w-9 h-9",
		xxl: "w-24 h-24",
	};
</script>

<img
	alt=""
	class="{SIZE_CLASS[size]} {author.type === 'user' ? 'rounded-full' : 'rounded'} {classNames} flex-none"
	src={author.avatarUrl}
	crossorigin="anonymous"
/>
