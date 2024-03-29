export interface Root {
    created: string
    count: number
    offset: number
    "release-groups": Group[]
}

export interface Group {
    id: string
    "type-id": string
    score: number
    "primary-type-id": string
    count: number
    title: string
    "first-release-date": string
    "primary-type": string
    "artist-credit": ArtistCredit[]
    releases: Release[]
}

export interface ArtistCredit {
    name: string
    artist: Artist
}

export interface Artist {
    id: string
    name: string
    "sort-name": string
    disambiguation: string
    aliases: Alias[]
}

export interface Alias {
    "sort-name": string
    "type-id": string
    name: string
    locale: any
    type: string
    primary: any
    "begin-date": any
    "end-date": any
}

export interface Release {
    id: string
    "status-id": string
    title: string
    status: string
}
