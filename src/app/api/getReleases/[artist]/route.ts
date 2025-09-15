import axios from "axios";
import { ReleaseRoot } from "@/types/release";
import { type NextRequest } from 'next/server'


export async function GET(
  request: NextRequest,
  { params }: { params: { artist: string } }
) {
  const artist = params.artist;
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get("limit") || 100;
  const offset = searchParams.get("offset") || 0;

  try {
    const {data, headers}  = await axios.get<ReleaseRoot>(
      "https://musicbrainz.org/ws/2/release",
      {
        params: {
          artist: artist,
          fmt: "json",
          inc: "release-groups+media",
          status: "official",
          type: "album|ep",
          limit: limit,
          offset: offset,
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
