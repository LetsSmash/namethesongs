export interface ReleaseGroupRoot {
  created: string;
  count: number;
  offset: number;
  "release-groups": Group[];
}

export interface Group {
  id: string;
  "type-id": string;
  score: number;
  "primary-type-id": string;
  count: number;
  title: string;
  "first-release-date": string;
  "primary-type": string;
  "artist-credit": ArtistCredit[];
  releases: Release[];
  "secondary-types"?: string[];
  "secondary-type-ids"?: string[];
}

export interface ArtistCredit {
  name: string;
  artist: Artist;
}

export interface Artist {
  id: string;
  name: string;
  "sort-name": string;
  disambiguation: string;
  aliases: Alias[];
}

export interface Alias {
  "sort-name": string;
  "type-id": string;
  name: string;
  locale: string;
  type: string;
  primary: string;
  "begin-date": string;
  "end-date": string;
}

export interface Release {
  id: string;
  "status-id": string;
  title: string;
  status: string;
}
