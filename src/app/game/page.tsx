import FormBackground from "@/app/components/FormBackground";

export default function Page({searchParams}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    return (
        <FormBackground>
            <h1>{searchParams['album']}</h1>
        </FormBackground>
    )
}