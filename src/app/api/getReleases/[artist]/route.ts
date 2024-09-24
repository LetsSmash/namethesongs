import axios from "axios";
import { ReleaseRoot } from "@/types/release";

export async function GET(
  request: Request,
  { params }: { params: { artist: string } }
) {
  const artist = params.artist;

  try {
    const { data } = await axios.get<ReleaseRoot>(
      "https://musicbrainz.org/ws/2/release",
      {
        params: {
          "release-group": artist,
          fmt: "json",
          limit: 100,
          inc: "media",
        },
        headers: {
          "User-Agent": "GuessTheSongs/0.1 ( http://namethesongs.vercel.app )",
        },
      }
    );
    return Response.json(data, { status: 200 });
  } catch (error) {
    return new Response(`Error fetching data: ${error}`, {
      status: 500,
    });
  }
}
