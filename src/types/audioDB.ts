export interface AudioDBArtist {
    artists: Artist[];
}

export interface Artist {
    idArtist:           string;
    strArtist:          string;
    strArtistStripped:  string;
    strArtistAlternate: string;
    strLabel:           string;
    idLabel:            string;
    intFormedYear:      string;
    intBornYear:        number;
    intDiedYear:        number;
    strDisbanded:       number;
    strStyle:           string;
    strGenre:           string;
    strMood:            string;
    strWebsite:         string;
    strFacebook:        string;
    strTwitter:         string;
    strBiographyEN:     string;
    strGender:          string;
    intMembers:         string;
    strCountry:         string;
    strCountryCode:     string;
    strArtistThumb:     string;
    strArtistLogo:      string;
    strArtistCutout:    string;
    strArtistClearart:  string;
    strArtistWideThumb: string;
    strArtistFanart:    string;
    strArtistFanart2:   string;
    strArtistFanart3:   string;
    strArtistFanart4:   string;
    strArtistBanner:    string;
    strMusicBrainzID:   string;
    strISNIcode:        string;
    strLastFMChart:     string;
    strLocked:          string;
}
