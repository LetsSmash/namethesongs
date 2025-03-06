import FormBackground from "@/app/components/FormBackground";
import { currentUser } from "@clerk/nextjs/server";
import { Divider } from "@nextui-org/react";
import Image from "next/image";

export default async function Page() {
    const user = await currentUser()
    return (
        <div className="flex justify-center items-center">
            <FormBackground additionalClasses="w-full max-w-md">
                {user?.hasImage && <Image src={user?.imageUrl} alt="Profile Picture" width={100} height={100}/>}
                <h2 className="text-center text-3xl font-bold">{user?.username}'s Profile</h2>
                <Divider />
            </FormBackground>
        </div>
    );
}