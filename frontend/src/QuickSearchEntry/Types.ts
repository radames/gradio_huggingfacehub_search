export type EntryType =
	| "dataset"
	| "all-datasets"
	| "model"
	| "all-models"
	| "space"
	| "all-spaces"
	| "org"
	| "user"
	| "no-results"
	| "paper"
	| "collection"
	| "full-text-search";

export interface Entry {
	href?:        string;
	id:           string;
	_id?:         string;
	imgUrl?:      string;
	label:        string;
	description?: string;
	type:         EntryType;
}
