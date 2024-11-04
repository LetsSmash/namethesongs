import axios from "axios";
import { ReleaseRoot } from "@/types/release";

export async function GET(
  request: Request,
  { params }: { params: { artist: string } }
) {
  const artist = params.artist;

  try {
    const {data, headers}  = await axios.get<ReleaseRoot>(
      "https://musicbrainz.org/ws/2/release",
      {
        params: {
          "release-group": artist,
          fmt: "json",
          limit: 100,
          inc: "media",
        },
        headers: {
          "User-Agent": "GuessTheSongs/1.0.0 ( http://namethesongs.vercel.app )",
        },
      }
    );
    const responseHeaders = new Headers();
    Object.entries(headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        responseHeaders.append(key, value);
      }
    });
    return new Response(JSON.stringify(data), { status: 200, headers: responseHeaders });
  } catch (error) {
    const errorMessage = error instanceof axios.AxiosError && error.response ? `Error fetching data: ${error}` : 'An unknown error occurred';
    const status = error instanceof axios.AxiosError && error.response ? error.response.status : 500;
    return new Response(errorMessage, {
      status: status,
    });
  }
}
