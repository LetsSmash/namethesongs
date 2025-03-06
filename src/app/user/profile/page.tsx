import { getAlbumsPlayedByUser, getScoresByUser } from "@/app/actions";
import FormBackground from "@/app/components/FormBackground";
import Scoreboard from "@/app/components/Scoreboard";
import { currentUser } from "@clerk/nextjs/server";
import { Divider } from "@nextui-org/react";
import Image from "next/image";

export default async function Page() {
  const user = await currentUser();
  const albums = await getAlbumsPlayedByUser();
  return (
    <FormBackground>
      <h2 className="text-center text-3xl font-bold pb-4">
        {user?.username}s Profile
      </h2>
      <Divider className="my-4" />
      <h2 className="text-center text-3xl font-semibold">Your Leaderboards</h2>
      <Divider className="my-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
        {albums.length !== 0 ? (
          albums.map((album: { mbid: string }) => (
            <Scoreboard key={album.mbid} mbid={album.mbid} />
          ))
        ) : (
          <>
            <div></div>
            <h2 className="text-xl font-semibold mt-4">
              You havent played any albums yet!
            </h2>
            <div></div>
          </>
        )}
      </div>
    </FormBackground>
  );
}
