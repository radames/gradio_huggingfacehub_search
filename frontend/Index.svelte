<svelte:options accessors={true} />

<script lang="ts">
  import type { Gradio } from "@gradio/utils";
  import { Block } from "@gradio/atoms";
  import { StatusTracker } from "@gradio/statustracker";
  import type { LoadingStatus } from "@gradio/statustracker";
  import "./output.css";
  import QuickSearch from "./src/QuickSearch/QuickSearch.svelte";
  import BlockTitle from "./src/BlockTile/BlockTitle.svelte";

  import type { QuickSearchType } from "./src/QuickSearch/Types";
  export let gradio: Gradio<{
    change: never;
    submit: never;
    input: never;
  }>;
  export let label = "Textbox";
  export let elem_id = "";
  export let elem_classes: string[] = [];
  export let visible = true;
  export let value = "";
  export let placeholder = "Search models, datasets, users...";
  export let show_label: boolean;
  export let scale: number | null = null;
  export let min_width: number | undefined = undefined;
  export let loading_status: LoadingStatus | undefined = undefined;
  export let value_is_output = false;
  export let interactive: boolean;
  export let search_type: QuickSearchType[] = [
    "model",
    "dataset",
    "space",
    "org",
    "user",
  ];
  export let sumbit_on_select = true;

  let el: HTMLTextAreaElement | HTMLInputElement;

  function handle_change(): void {
    gradio.dispatch("change");
    if (!value_is_output) {
      gradio.dispatch("input");
    }
  }

  $: if (value === null) value = "";

  // When the value changes, dispatch the change event via handle_change()
  // See the docs for an explanation: https://svelte.dev/docs/svelte-components#script-3-$-marks-a-statement-as-reactive
  $: value, handle_change();
</script>

<div class="custom-component">
  <Block
    {visible}
    {elem_id}
    {elem_classes}
    {scale}
    {min_width}
    allow_overflow={true}
    padding={true}
  >
    {#if loading_status}
      <StatusTracker
        autoscroll={gradio.autoscroll}
        i18n={gradio.i18n}
        {...loading_status}
      />
    {/if}
    <BlockTitle classNames="z-0" {show_label} info={undefined}
      >{label}</BlockTitle
    >
    <div class="z-50 relative">
      <QuickSearch
        bind:inputValue={value}
        classNames="flex-1"
        header
        showIcon
        disabled={!interactive}
        {placeholder}
        searchParams={{
          withLinks: true,
          searchType: search_type,
        }}
        on:selected={() => {
          if (sumbit_on_select) {
            gradio.dispatch("submit");
          }
        }}
      />
    </div>
  </Block>
</div>

<style>
</style>
