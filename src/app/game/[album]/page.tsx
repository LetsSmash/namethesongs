import FormBackground from "@/app/components/FormBackground";
import MainGame from "@/app/pages/MainGame";
import { fetchAlbumInfos } from "@/app/utils";

interface Params {
  album: string;
}

export async function generateMetadata({ params }: { params: Params }) {
  const id = params.album;
  const albumInfo = await fetchAlbumInfos(id);

  return {
    metadataBase: new URL("https://namethesongs.vercel.app/"),
    openGraph: {
      // TODO: Change this, i don't have the nerves to do it now
      title: albumInfo.title,
      description: `Can you name the Songs on the Album ${albumInfo.title}? Find out by yourself.`
    },
  };
}

export default function Page({ params }: { params: Params }) {
  return (
    <FormBackground>
      <MainGame album={params.album} />
    </FormBackground>
  );
}
