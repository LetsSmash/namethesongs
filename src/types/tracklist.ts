export interface TracklistRoot {
  media: Medum[];
  quality: string;
  barcode: string;
  "status-id": string;
  disambiguation: string;
  "packaging-id": string;
  "release-group": ReleaseGroup;
  "text-representation": TextRepresentation;
  status: string;
  date: string;
  packaging: string;
  title: string;
  "release-events": Event[];
  id: string;
  "cover-art-archive": CoverArtArchive;
  country: string;
  asin: string;
}

export interface Medum {
  "format-id": string;
  title: string;
  format: string;
  tracks: Track[];
  "track-offset": number;
  position: number;
  "track-count": number;
}

export interface Track {
  position: number;
  length?: number;
  title: string;
  recording?: Recording;
  number?: string;
  id?: string;
}

export interface Recording {
  length: number;
  title: string;
  id: string;
  "first-release-date": string;
  disambiguation: string;
  video: boolean;
}

export interface ReleaseGroup {
  "primary-type-id": string;
  title: string;
  "secondary-types": string[];
  "secondary-type-ids": string[];
  id: string;
  "first-release-date": string;
  "primary-type": string;
  disambiguation: string;
}

export interface TextRepresentation {
  script: string;
  language: string;
}

export interface Event {
  date: string;
  area: Area;
}

export interface Area {
  "sort-name": string;
  type: string;
  name: string;
  "iso-3166-1-codes": string[];
  disambiguation: string;
  id: string;
  "type-id": string;
}

export interface CoverArtArchive {
  count: number;
  darkened: boolean;
  artwork: boolean;
  front: boolean;
  back: boolean;
}
