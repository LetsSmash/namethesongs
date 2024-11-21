import { AudioDBArtist } from "@/types/audioDB";
import axios from "axios";

export async function GET(
    request: Request,
    { params }: { params: { artist: string } }
  ) {
    const artist = params.artist;

    try {
        const apiKey = process.env.TADB_PRIVATE_KEY;
        if (!apiKey) {
          throw new Error("TADB_PRIVATE_KEY is not set");
        }
        const { data } = await axios.get<AudioDBArtist>(
          `https://www.theaudiodb.com/api/v1/json/${apiKey}/artist-mb.php`,
          {
            params: {
              i: artist,
            },
          }
        );
        return new Response(data.artists[0].strArtistLogo, { status: 200 });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return new Response(String(error), { status: error.response?.status || 500 });
        } else {
          return new Response(String(error), { status: 500 });
        }
      }
  }