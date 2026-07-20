import FormBackground from "@/app/components/FormBackground";
import Highscores from "@/app/pages/Highscores";

export default function Page() {
  return (
      <FormBackground additionalClasses="sm:mx-auto sm:w-full sm:max-w-3xl">
        <Highscores />
      </FormBackground>
  );
}
