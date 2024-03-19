import FormBackground from "@/app/components/FormBackground";
import MainGame from "@/app/components/MainGame";
import {notFound} from "next/navigation";

interface Params {
    slug: string[];
}

export function generateMetadata({params}: {params: Params}){
    const slug = params.slug

    return {
        openGraph: {
            title: `Name the Songs: ${slug[1]} by ${slug[0]}`,
            description: `Can you name the Songs on the Album "${decodeURI(slug[1])}" by ${decodeURI(slug[0])}? Find out by yourself`
        }
    }
}

export default function Page({
  params,
 }: {
    params: Params
}){

    if (params.slug.length != 2){
        notFound()
    }

    return (
        <FormBackground>
            <MainGame album={params.slug[1]} artist={params.slug[0]} />
        </FormBackground>
    )
}