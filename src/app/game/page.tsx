import FormBackground from "@/app/components/FormBackground";
import MainGame from "@/app/components/MainGame";

export default function Page({searchParams}: {
    searchParams: { [key: string]: string }
}) {

    const params = searchParams['album']

    return (
        <FormBackground>
            <MainGame album={params} />
        </FormBackground>
    )
}