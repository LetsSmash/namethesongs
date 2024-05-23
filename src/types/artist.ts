export interface Root {
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
  ended: any;
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
  ended: any;
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
  ended: any;
}

export interface Alias {
  "sort-name": string;
  "type-id"?: string;
  name: string;
  locale?: string;
  type?: string;
  primary: any;
  "begin-date"?: string;
  "end-date": any;
}

export interface Tag {
  count: number;
  name: string;
}
