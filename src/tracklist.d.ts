export interface Root {
    "status-id": string
    title: string
    asin: any
    quality: string
    media: Medum[]
    id: string
    barcode: string
    date: string
    "packaging-id": string
    country: string
    status: string
    packaging: string
    disambiguation: string
    "release-events": Event[]
    "cover-art-archive": CoverArtArchive
    "text-representation": TextRepresentation
}

export interface Medum {
    tracks: Track[]
    "track-count": number
    "track-offset": number
    position: number
    "format-id": string
    format: string
    title: string
}

export interface Track {
    title: string
    recording?: Recording
    number?: string
    position: number
    id?: string
    length?: number
}

export interface Recording {
    title: string
    id: string
    video: boolean
    length: number
    "first-release-date": string
    disambiguation: string
}

export interface Event {
    area: Area
    date: string
}

export interface Area {
    "type-id": any
    name: string
    "sort-name": string
    disambiguation: string
    "iso-3166-1-codes": string[]
    type: any
    id: string
}

export interface CoverArtArchive {
    darkened: boolean
    count: number
    front: boolean
    back: boolean
    artwork: boolean
}

export interface TextRepresentation {
    language: string
    script: string
}
