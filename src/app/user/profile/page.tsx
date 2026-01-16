import { getAlbumsPlayedByUser, getArtistsPlayedByUser } from "@/app/actions";
import FormBackground from "@/app/components/FormBackground";
import Scoreboard from "@/app/components/Scoreboard";
import { currentUser } from "@clerk/nextjs/server";
import { Divider } from "@heroui/react";

export default async function Page() {
    const user = await currentUser();
    const albums = await getAlbumsPlayedByUser();
    const artists = await getArtistsPlayedByUser();
    return (
        <FormBackground>
            <h2 className="text-center text-3xl font-bold pb-4">
                {`${user?.username}'s Profile`}
            </h2>
            <Divider className="my-4" />
            <h2 className="text-center text-3xl font-semibold">Album Leaderboards</h2>
            <Divider className="my-4" />
            {albums.length !== 0 ? (
                <div className="flex flex-wrap justify-center gap-6 mt-4">
                    {albums.map((album: { mbid: string }) => (
                        <Scoreboard key={album.mbid} mbid={album.mbid} mode="user" showPlayButton={true} />
                    ))}
                </div>
            ) : (
                <>
                    <div className="flex justify-center">
                        <h2 className="text-xl font-semibold mt-4 mb-4">
                            You havent played any albums yet!
                        </h2>
                    </div>
                </>
            )}
            <Divider className="my-4" />
            <h2 className="text-center text-3xl font-semibold">Artist Leaderboards</h2>
            <Divider className="my-4" />
            {artists.length !== 0 ? (
                <div className="flex flex-wrap justify-center gap-6 mt-4">
                    {artists.map((artist: { mbid: string }) => (
                        <Scoreboard key={artist.mbid} mbid={artist.mbid} mode="user" types="artist" configMode="all" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="flex justify-center">
                        <h2 className="text-xl font-semibold mt-4">
                            You havent played any artists yet!
                        </h2>
                    </div>
                </>
            )}
        </FormBackground>
    );
}