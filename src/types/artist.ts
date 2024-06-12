export interface ArtistRoot {
  created: string;
  count: number;
  offset: number;
  artists: Artist[];
}

export interface Artist {
  id: string;
  type?: string;
  "type-id"?: string;
  score: number;
  name: string;
  "sort-name": string;
  "life-span": LifeSpan;
  country?: string;
  area?: Area;
  "begin-area"?: BeginArea;
  isnis?: string[];
  aliases?: Alias[];
  tags?: Tag[];
  disambiguation?: string;
  "gender-id"?: string;
  gender?: string;
}

export interface LifeSpan {
  begin?: string;
  ended: string;
}

export interface Area {
  id: string;
  type: string;
  "type-id": string;
  name: string;
  "sort-name": string;
  "life-span": LifeSpan2;
}

export interface LifeSpan2 {
  ended: string;
}

export interface BeginArea {
  id: string;
  type: string;
  "type-id": string;
  name: string;
  "sort-name": string;
  "life-span": LifeSpan3;
}

export interface LifeSpan3 {
  ended: string;
}

export interface Alias {
  "sort-name": string;
  "type-id"?: string;
  name: string;
  locale?: string;
  type?: string;
  primary: string;
  "begin-date"?: string;
  "end-date": string;
}

export interface Tag {
  count: number;
  name: string;
}
