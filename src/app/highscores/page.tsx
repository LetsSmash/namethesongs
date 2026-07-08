import Link from "next/link";
import FormBackground from "@/app/components/FormBackground";
import Highscores from "@/app/pages/Highscores";

export const metadata = {
  title: "Highscores | Name The Songs",
  description: "Browse the highscores for any album or artist.",
};

export default function Page() {
  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
      <FormBackground>
        <div className="flex justify-end pb-4">
          <Link href="/" className="text-primary hover:underline">
            Back to Game
          </Link>
        </div>
        <h2 className="text-center text-3xl font-bold pb-4">Highscores</h2>
        <p className="text-center text-gray-600 pb-4">
          Pick an album or an artist to see how everyone ranks.
        </p>
        <Highscores />
      </FormBackground>
    </div>
  );
}
