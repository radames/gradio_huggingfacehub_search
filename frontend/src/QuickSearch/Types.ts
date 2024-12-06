export type QuickSearchType =
  | "model"
  | "dataset"
  | "space"
  | "org"
  | "user"
  | "paper"
  | "collection";

export type OrgFilter = "own" | "unwatched";
export type RepoFilter = "skip_disabled" | "skip_gated" | "own" | "own_orgs";

export interface QuickSearchRepoResult {
  _id: string;
  id: string;
}
export type QuickSearchDatasetResult = QuickSearchRepoResult;
export type QuickSearchModelResult = QuickSearchRepoResult;
export type QuickSearchSpaceResult = QuickSearchRepoResult;
export type QuickSearchPaperResult = QuickSearchRepoResult;

export interface QuickSearchOrgResult {
  _id: string;
  avatarUrl: string;
  fullname: string;
  name: string;
}

export interface QuickSearchUserResult {
  _id: string;
  avatarUrl: string;
  fullname: string;
  user: string;
}

export interface QuickSearchCollectionResult {
  _id: string;
  title: string;
  description?: string;
}

export interface QuickSearchResults {
  datasets: QuickSearchDatasetResult[];
  datasetsCount: number;
  models: QuickSearchModelResult[];
  modelsCount: number;
  orgs: QuickSearchOrgResult[];
  q: string;
  spaces: QuickSearchSpaceResult[];
  spacesCount: number;
  users: QuickSearchUserResult[];
  papers: QuickSearchPaperResult[];
  papersCount: number;
  collections: QuickSearchCollectionResult[];
  collectionsCount: number;
}
