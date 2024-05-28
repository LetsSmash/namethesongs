export interface ReleaseRoot {
  releases: Release[];
  "release-count": number;
  "release-offset": number;
}

export interface Release {
  date: string;
  barcode: string;
  "release-events": Event[];
  country: string;
  id: string;
  "packaging-id": string;
  "release-group": ReleaseGroup;
  title: string;
  packaging: string;
  status: string;
  quality: string;
  media: Medum[];
  asin: any;
  "cover-art-archive": CoverArtArchive;
  "text-representation": TextRepresentation;
  disambiguation: string;
  "status-id": string;
}

export interface Event {
  area: Area;
  date: string;
}

export interface Area {
  name: string;
  "iso-3166-1-codes": string[];
  "type-id": any;
  disambiguation: string;
  id: string;
  type: any;
  "sort-name": string;
}

export interface Medum {
  title: string;
  "format-id": string;
  position: number;
  format: string;
  "track-count": number;
}

export interface ReleaseGroup {
  "primary-type-id": string;
  title: string;
  "secondary-types": any[];
  "secondary-type-ids": any[];
  id: string;
  "first-release-date": string;
  "primary-type": string;
  disambiguation: string;
}

export interface CoverArtArchive {
  front: boolean;
  back: boolean;
  artwork: boolean;
  darkened: boolean;
  count: number;
}

export interface TextRepresentation {
  script: string;
  language: string;
}
