import FormBackground from "@/app/components/FormBackground";
import MainGame from "@/app/components/MainGame";
import {redirect} from "next/navigation";

export default function Page({searchParams}: {
    searchParams: { [key: string]: string }
}) {

    if (Object.keys(searchParams).length == 0 || Object.values(searchParams).includes('')){
        redirect("/")
    }

    return (
        <FormBackground>
            <MainGame album={searchParams['album']} artist={searchParams['artist']}/>
        </FormBackground>
    )
}