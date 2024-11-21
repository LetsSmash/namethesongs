import FormBackground from "@/app/components/FormBackground";
import MainGame from "@/app/pages/MainGame";
import { fetchAlbumInfos, fetchReleaseGroupFromRelease } from "@/app/utils";

interface Params {
  album: string;
}

export async function generateMetadata({ params }: { params: Params }) {
  const id = params.album;
  const releaseInfo = await fetchReleaseGroupFromRelease(id);
  const albumInfo = await fetchAlbumInfos(releaseInfo["release-group"].id);

  return {
    metadataBase: new URL("https://namethesongs.vercel.app/"),
    openGraph: {
      title: `Name the Songs: ${albumInfo.title} by ${albumInfo["artist-credit"][0].name}`,
      description: `Can you name the Songs on the Album "${albumInfo.title}" by ${albumInfo["artist-credit"][0].name}?`,
    },
  };
}

export default function Page({ params }: { params: Params }) {
  return (
    <div className="flex justify-center items-center max-w-">
      <FormBackground additionalClasses="w-full max-w-md">
        <MainGame album={params.album} />
      </FormBackground>
    </div>
  );
}
