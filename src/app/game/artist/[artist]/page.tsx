import FormBackground from "@/app/components/FormBackground";
import { fetchAlbumInfos, fetchReleaseGroupFromRelease } from "@/app/utils";
import MainGameArtist from "@/app/pages/MainGameArtist";

interface Params {
  artist: string;
}

/* export async function generateMetadata({ params }: { params: Params }) {
  const id = params.artist;
  const releaseInfo = await fetchReleaseGroupFromRelease(id)
  const albumInfo = await fetchAlbumInfos(releaseInfo["release-group"].id)

  return {
    metadataBase: new URL("https://namethesongs.vercel.app/"),
    openGraph: {
      title: `Name the Songs: ${albumInfo.title} by ${albumInfo["artist-credit"][0].name}`,
      description: `Can you name the Songs on the Album "${albumInfo.title}" by ${albumInfo["artist-credit"][0].name}?`,
    },
  };
} */

export default function Page({ params }: { params: Params }) {
  return (
    <FormBackground>
      <MainGameArtist artist={params.artist}/>
    </FormBackground>
  );
}
