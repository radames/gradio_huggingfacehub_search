<script lang="ts">
  import type { Entry } from "../../QuickSearchEntry/Types";
  import type {
    OrgFilter,
    QuickSearchResults,
    QuickSearchType,
    RepoFilter,
  } from "./Types";

  import { createEventDispatcher, onMount, tick } from "svelte";

  import IconSearch from "../Icons/IconSearch.svelte";
  import QuickSearchEntry from "./../QuickSearchEntry/QuickSearchEntry.svelte";
  import { httpGet, queryString, throttle } from "../lib/ViewUtils";

  const THROTTLE_DELAY = 300;

  export const hydrate = true;

  export let classNames = "";
  export let bodyClassNames = "";
  export let inputClassNames = "";
  export let header = false;
  export let showIcon = false;
  export let inputName = "";
  export let placeholder = "";
  export let required = false;
  export let inputValue = "";
  export let disabled = false;
  export let searchParams: {
    lang?: string;
    library?: string;
    limit?: number;
    orgsFilter?: OrgFilter[];
    pipelines?: string[];
    reposFilter?: RepoFilter[];
    searchType?: QuickSearchType[];
    withLinks?: boolean;
    exclude?: string[];
    namespace?: string;
  } = {};
  export let url: string = "https://huggingface.co/api/quicksearch";
  export let initialFocus = false;
  export let position: "absolute" | "fixed" = "absolute";
  export let showSearchType = true;
  export let resetLastQueryOnCommit = false;

  let entries: Entry[] = [];
  let isOpen = false;
  let lastQuery: string | null = null;
  let numResults = 0;
  let resultsWrapperElement: HTMLElement;
  let resultsContainerWrapperElement: HTMLElement;
  let inputElement: HTMLInputElement;
  let selectedEntryIdx = -1;
  let wrapperElement: HTMLElement;
  let searchController = new AbortController();

  const resultElements: Record<string, HTMLElement> = {};
  const dispatch = createEventDispatcher<{ selected: Entry; close: void }>();

  $: if (position === "fixed" && resultsContainerWrapperElement) {
    resultsContainerWrapperElement.style.width = `${inputElement.clientWidth}px`;
  }
  $: if (!isOpen) {
    dispatch("close");
  }

  onMount(() => {
    document.addEventListener("click", handleClickDocument);
    if (initialFocus) {
      inputElement.focus();
    }
    return () => {
      document.removeEventListener("click", handleClickDocument);
    };
  });

  function handleClickDocument(e: MouseEvent) {
    if (!isOpen) {
      return;
    }
    // We ignore clicks that happens inside the Dropdown itself
    // (prevent race condition  with other click handlers)
    const targetElement = e.target as HTMLElement;
    if (
      targetElement !== wrapperElement &&
      !wrapperElement?.contains(targetElement)
    ) {
      isOpen = false;
    }
  }

  function handleClickEntry(entry: Entry) {
    selectedEntryIdx = entries.findIndex(
      (e) => e.id === entry.id && e.type === entry.type
    );
    handleCommit();
  }

  function handleCommit() {
    if (entries[selectedEntryIdx]) {
      const entry = entries[selectedEntryIdx];
      inputValue = entry.id;
      dispatch("selected", entry);

      if (resetLastQueryOnCommit) {
        lastQuery = null;
      }
      isOpen = false;
    }
  }

  function updateSelected(direction: 1 | -1) {
    if (direction === 1) {
      selectedEntryIdx =
        selectedEntryIdx + 1 > entries.length - 1 ? 0 : selectedEntryIdx + 1;
    } else {
      selectedEntryIdx =
        selectedEntryIdx - 1 < 0 ? entries.length - 1 : selectedEntryIdx - 1;
    }

    const entry = entries[selectedEntryIdx];

    if (!entry) {
      return;
    }

    const element = resultElements[getEntryElementId(entry)];

    if (element.offsetTop < resultsWrapperElement.scrollTop) {
      const firstEltHeight =
        resultsWrapperElement.firstElementChild?.clientHeight || 0;
      resultsWrapperElement.scrollTo({
        top: element.offsetTop - firstEltHeight,
      });
    } else if (
      element.offsetTop + element.offsetHeight >
      resultsWrapperElement.scrollTop + resultsWrapperElement.offsetHeight
    ) {
      resultsWrapperElement.scrollTo({ top: element.offsetTop });
    }
  }

  async function handleFocus() {
    if (lastQuery === null) {
      await performSearch();
    }
    isOpen = true;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      isOpen = false;
    } else if (e.key === "Enter" && isOpen) {
      e.preventDefault();
      handleCommit();
    } else if (e.altKey && e.key === "ArrowUp" && isOpen) {
      e.preventDefault();
      isOpen = false;
    } else if (e.altKey && e.key === "ArrowDown" && !isOpen) {
      e.preventDefault();
      isOpen = true;
    } else if (e.key === "ArrowUp" && isOpen) {
      e.preventDefault();
      updateSelected(-1);
    } else if (e.key === "ArrowDown" && isOpen) {
      e.preventDefault();
      updateSelected(1);
    } else if ((e.metaKey || e.ctrlKey) && e.code === "KeyK") {
      // prevent z-index issue when SpotlightSearch modal is open
      e.preventDefault();
      isOpen = false;
    }
  }

  async function performSearch() {
    const input = inputValue.trim();
    if (input !== lastQuery) {
      const res = await fetchResults(input);
      if (res.isError) {
        if (!res.aborted) {
          console.error(`QuickSearch Error: ${res.error}`);
        }
        return;
      }

      const resEntries = getResultEntries(res.payload);
      entries = [...resEntries];
      numResults = resEntries.length;
      lastQuery = input;
      selectedEntryIdx = entries.length ? 0 : -1;
    }
  }

  const handleInput = throttle(async () => {
    isOpen = true;
    await tick(); // Let parent component change searchParams such as orgFilters first
    await performSearch();
  }, THROTTLE_DELAY);

  function isSelected(selectedEntryIdx: number, entry: Entry) {
    return (
      entries[selectedEntryIdx]?.id === entry.id &&
      entries[selectedEntryIdx]?.type === entry.type
    );
  }

  async function fetchResults(input: string = "") {
    searchController.abort(); /// Cancel previous function call if exists
    searchController = new AbortController();

    const {
      lang,
      library,
      limit,
      orgsFilter,
      pipelines,
      reposFilter,
      searchType,
      exclude,
      namespace,
    } = searchParams;
    const pipelinesValue = pipelines?.filter((x) => x?.trim()).join(",");
    const res = await httpGet<QuickSearchResults>(
      url +
        queryString({
          q: input,
          lang,
          library,
          limit,
          orgsFilter,
          pipelines: pipelinesValue,
          reposFilter,
          type: searchType,
          exclude,
          namespace,
        }),
      { signal: searchController.signal }
    );

    return res;
  }

  function getResultEntries(results: QuickSearchResults | null): Entry[] {
    const total =
      (results?.datasets.length ?? 0) +
      (results?.models.length ?? 0) +
      (results?.orgs.length ?? 0) +
      (results?.spaces.length ?? 0) +
      (results?.users.length ?? 0) +
      (results?.papers.length ?? 0) +
      (results?.collections.length ?? 0);

    if (!results || !total) {
      return [];
    }

    const modelEntries: Entry[] = results.models.map((m) => ({
      href: searchParams.withLinks ? `/${m.id}` : undefined,
      id: m.id,
      _id: m._id,
      label: m.id,
      type: "model",
    }));

    const allModelsEntry: Entry[] =
      searchParams.withLinks && results.modelsCount && results.q ? [] : [];

    const datasetEntries: Entry[] = results.datasets.map((d) => ({
      href: searchParams.withLinks ? `/datasets/${d.id}` : undefined,
      id: d.id,
      _id: d._id,
      label: d.id,
      type: "dataset",
    }));

    const allDatasetsEntry: Entry[] =
      searchParams.withLinks && results.datasetsCount && results.q ? [] : [];

    const spaceEntries: Entry[] = results.spaces.map((d) => ({
      href: searchParams.withLinks ? `/spaces/${d.id}` : undefined,
      id: d.id,
      _id: d._id,
      label: d.id,
      type: "space",
    }));

    const allSpacesEntry: Entry[] =
      searchParams.withLinks && results.spacesCount && results.q ? [] : [];

    const orgEntries: Entry[] = results.orgs.map((o) => ({
      href: searchParams.withLinks ? `/${o.name}` : undefined,
      id: o.name,
      _id: o._id,
      imgUrl: o.avatarUrl,
      label: o.fullname,
      type: "org",
    }));

    const userEntries: Entry[] = results.users.map((u) => ({
      href: searchParams.withLinks ? `/${u.user}` : undefined,
      id: u.user,
      _id: u._id,
      imgUrl: u.avatarUrl,
      label: u.user,
      type: "user",
      description: u.fullname,
    }));

    const paperEntries: Entry[] = results.papers.map((p) => ({
      _id: p._id,
      id: p._id,
      href: searchParams.withLinks ? `/paper/${p._id}` : undefined,
      label: p._id,
      description: p.id,
      type: "paper",
    }));

    const collectionEntries: Entry[] = results.collections.map((c) => ({
      _id: c._id,
      id: c._id,
      href: searchParams.withLinks ? `/collections/${c._id}` : undefined,
      label: c.title,
      description: c.description,
      type: "collection",
    }));

    return [
      ...modelEntries,
      ...allModelsEntry,
      ...datasetEntries,
      ...allDatasetsEntry,
      ...spaceEntries,
      ...allSpacesEntry,
      ...orgEntries,
      ...userEntries,
      ...(paperEntries ?? []),
      ...(collectionEntries ?? []),
    ];
  }

  function getEntryElementId(entry: Entry) {
    return `${entry.type}__${entry.id}`;
  }
</script>

<div bind:this={wrapperElement} class="relative {classNames}">
  <input
    {disabled}
    autocomplete="off"
    bind:value={inputValue}
    bind:this={inputElement}
    class="relative z-0 w-full dark:bg-gray-950 {showIcon ? 'pl-8' : ''} 
			{header
      ? 'form-input-alt h-9 pr-3 focus:shadow-xl'
      : 'form-input'} {inputClassNames}"
    name={inputName}
    on:focus={handleFocus}
    on:input={handleInput}
    on:keydown={handleKeyDown}
    {placeholder}
    {required}
    spellcheck="false"
    type="text"
  />
  {#if showIcon}
    <IconSearch
      classNames="absolute left-2.5 text-gray-400 top-1/2 transform -translate-y-1/2"
    />
  {/if}
  {#if isOpen}
    <div
      class="{position} z-40 w-full md:min-w-[24rem]"
      bind:this={resultsContainerWrapperElement}
    >
      <ul
        class="dark:bg-gray-950 mt-1 max-h-[calc(100vh-100px)] w-full divide-y divide-gray-100 overflow-hidden overflow-y-auto rounded-lg border border-gray-100 bg-white text-sm shadow-lg dark:divide-gray-900 {bodyClassNames}"
        bind:this={resultsWrapperElement}
      >
        {#if !numResults}
          <QuickSearchEntry
            entry={{
              id: "no-result",
              label: "No results found :(",
              type: "no-results",
            }}
            isSelected={false}
            onClick={() => {}}
          />
        {/if}

        {#if entries.some((x) => x.type === "model")}
          {#if showSearchType}
            <li
              class="flex h-7 items-center bg-gradient-to-r from-blue-50 to-white px-2 font-semibold text-blue-800 dark:from-blue-900 dark:to-gray-950 dark:text-gray-300"
            >
              Models
            </li>
          {/if}
          {#each entries.filter( (x) => ["model", "all-models"].includes(x.type) ) as entry}
            <li bind:this={resultElements[getEntryElementId(entry)]}>
              <QuickSearchEntry
                {entry}
                isSelected={isSelected(selectedEntryIdx, entry)}
                onClick={handleClickEntry}
              />
            </li>
          {/each}
        {/if}

        {#if entries.some((x) => x.type === "dataset")}
          {#if showSearchType}
            <li
              class="flex h-7 items-center bg-gradient-to-r from-red-50 to-white px-2 font-semibold text-red-800 dark:from-red-900 dark:to-gray-950 dark:text-gray-300"
            >
              Datasets
            </li>
          {/if}
          {#each entries.filter( (x) => ["dataset", "all-datasets"].includes(x.type) ) as entry}
            <li bind:this={resultElements[getEntryElementId(entry)]}>
              <QuickSearchEntry
                {entry}
                isSelected={isSelected(selectedEntryIdx, entry)}
                onClick={handleClickEntry}
              />
            </li>
          {/each}
        {/if}

        {#if entries.some((x) => x.type === "space")}
          {#if showSearchType}
            <li
              class="flex h-7 items-center bg-gradient-to-r from-orange-50 to-white px-2 font-semibold text-orange-800 dark:from-orange-900 dark:to-gray-950 dark:text-gray-300"
            >
              Spaces
            </li>
          {/if}
          {#each entries.filter( (x) => ["space", "all-spaces"].includes(x.type) ) as entry}
            <li bind:this={resultElements[getEntryElementId(entry)]}>
              <QuickSearchEntry
                {entry}
                isSelected={isSelected(selectedEntryIdx, entry)}
                onClick={handleClickEntry}
              />
            </li>
          {/each}
        {/if}

        {#if entries.some((x) => x.type === "org")}
          {#if showSearchType}
            <li
              class="flex h-7 items-center bg-gradient-to-r from-purple-50 to-white px-2 font-semibold text-indigo-800 dark:from-indigo-900 dark:to-gray-950 dark:text-gray-300"
            >
              Organizations
            </li>
          {/if}
          {#each entries.filter((x) => x.type === "org") as entry}
            <li bind:this={resultElements[getEntryElementId(entry)]}>
              <QuickSearchEntry
                {entry}
                isSelected={isSelected(selectedEntryIdx, entry)}
                onClick={handleClickEntry}
              />
            </li>
          {/each}
        {/if}

        {#if entries.some((x) => x.type === "user")}
          {#if showSearchType}
            <li
              class="flex h-7 items-center bg-gradient-to-r from-teal-50 to-white px-2 font-semibold text-teal-800 dark:from-teal-900 dark:to-gray-950 dark:text-gray-300"
            >
              Users
            </li>
          {/if}
          {#each entries.filter((x) => x.type === "user") as entry}
            <li bind:this={resultElements[getEntryElementId(entry)]}>
              <QuickSearchEntry
                {entry}
                isSelected={isSelected(selectedEntryIdx, entry)}
                onClick={handleClickEntry}
              />
            </li>
          {/each}
        {/if}

        {#if entries.some((x) => x.type === "paper")}
          {#if showSearchType}
            <li
              class="flex h-7 items-center bg-gradient-to-r from-gray-50 to-white px-2 font-semibold text-gray-800 dark:from-gray-900 dark:to-gray-950 dark:text-gray-300"
            >
              Papers
            </li>
          {/if}
          {#each entries.filter((x) => x.type === "paper") as entry}
            <li bind:this={resultElements[getEntryElementId(entry)]}>
              <QuickSearchEntry
                {entry}
                isSelected={isSelected(selectedEntryIdx, entry)}
                onClick={handleClickEntry}
              />
            </li>
          {/each}
        {/if}

        {#if entries.some((x) => x.type === "collection")}
          {#if showSearchType}
            <li
              class="flex h-7 items-center bg-gradient-to-r from-gray-50 to-white px-2 font-semibold text-gray-800 dark:from-gray-900 dark:to-gray-950 dark:text-gray-300"
            >
              Collections
            </li>
          {/if}
          {#each entries.filter((x) => x.type === "collection") as entry}
            <li bind:this={resultElements[getEntryElementId(entry)]}>
              <QuickSearchEntry
                {entry}
                isSelected={isSelected(selectedEntryIdx, entry)}
                onClick={handleClickEntry}
              />
            </li>
          {/each}
        {/if}
      </ul>
      {#if entries.some((x) => x.type === "full-text-search")}
        <ul
          class="mt-1 max-h-[calc(100vh-100px)] w-full divide-y divide-gray-100 overflow-hidden overflow-y-auto rounded-lg border border-gray-100 bg-white text-sm shadow-lg"
        >
          {#each entries.filter((x) => x.type === "full-text-search") as entry}
            <li bind:this={resultElements[getEntryElementId(entry)]}>
              <QuickSearchEntry
                {entry}
                isSelected={isSelected(selectedEntryIdx, entry)}
                onClick={handleClickEntry}
              />
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
