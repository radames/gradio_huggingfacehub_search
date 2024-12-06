<script lang="ts">
  import type { Entry } from "./Types";

  import AuthorAvatar from "../AuthorAvatar/AuthorAvatar.svelte";
  import IconArrowRight from "../Icons/IconArrowRight.svelte";

  export let entry: Entry;
  export let isSelected: boolean;
  export let onClick: (entry: Entry) => void;
</script>

<a
  class="flex h-8 cursor-pointer items-center px-2
		{['dataset', 'model', 'no-results', 'space'].includes(entry.type)
    ? 'font-mono text-xs'
    : ''}
		{['all-datasets', 'all-models', 'all-spaces'].includes(entry.type) &&
  !isSelected
    ? 'text-gray-400'
    : ''}
		{isSelected
    ? 'bg-blue-500 text-white dark:bg-blue-700'
    : 'hover:bg-gray-50 dark:hover:bg-gray-900'}"
  href={entry.href}
  on:click|preventDefault|stopPropagation={() => onClick(entry)}
>
  {#if ["all-datasets", "all-models", "all-spaces"].includes(entry.type)}
    <IconArrowRight classNames="flex-none mr-1 h-3 w-3" />
  {:else if ["org", "user"].includes(entry.type) && entry.imgUrl}
    <AuthorAvatar
      author={{
        avatarUrl: entry.imgUrl,
        type: entry.type === "user" ? "user" : "org",
      }}
      classNames="mr-1.5"
    />
  {:else if entry.type === "full-text-search"}
    <span
      class="mr-1.5 rounded px-1 text-xs leading-tight {isSelected
        ? 'bg-white/10 text-white'
        : 'bg-blue-500/10 text-blue-700 dark:text-blue-200'}">new</span
    >
  {/if}
  <span
    class="flex-shrink-0 truncate
			{entry.type === 'model' && !isSelected
      ? 'rounded bg-gradient-to-b from-gray-50 to-gray-100 px-1 dark:from-gray-925 dark:to-gray-950'
      : 'px-1'}"
  >
    {entry.label}
  </span>
  {#if entry.description}
    <span class="pl-0.5 pr-1.5 text-gray-300">·</span>
    <span class="mr-2 truncate {isSelected ? 'text-white' : 'text-gray-400'}"
      >{entry.description}</span
    >
  {/if}
  {#if entry.type === "full-text-search"}
    <IconArrowRight classNames="flex-none ml-auto h-3.5 w-3.5 " />
  {/if}
</a>
