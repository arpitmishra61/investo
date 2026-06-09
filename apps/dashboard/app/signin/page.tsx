"use client"
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "../components/Logo";
import Link from "next/link";
import { TypeAnimation } from 'react-type-animation';

export default function LoggedInUsers() {
    return (
        <Card className="w-[50%] m-auto h-[500px] mt-16">

            <div className=" space-y-4 flex flex-col items-center justify-center h-screen sign-in-screen">
                <Logo />
                <TypeAnimation
                    sequence={[

                        'Start Your Trading Journey...',
                        3000,
                    ]}
                    wrapper="span"
                    speed={30}
                    style={{ fontSize: '2em', display: 'inline-block' }}
                    repeat={Infinity}
                />
                {/* Title */}
                <h2 className="text-lg font-semibold text-gray-900">select one of the profile</h2>

                {/* Card List */}
                <div className="space-y-3">
                    {/* Card 1 */}
                    <Link href={"/"}>
                        <Card className="group transition-all duration-300 ease-in-out hover:bg-black w-[300px] py-0">
                            <CardContent className="flex items-center gap-4 p-4">
                                <Avatar>
                                    <AvatarFallback
                                        className="
          bg-gray-200 text-black
          transition-colors duration-300
          group-hover:bg-white group-hover:text-black
        "
                                    >
                                        JD
                                    </AvatarFallback>
                                </Avatar>

                                <span
                                    className="
      text-sm font-medium
      text-gray-900
      transition-colors duration-300
      group-hover:text-white
    "
                                >
                                    John Doe
                                </span>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Card 2 */}
                    <Link href={"/"}>
                        <Card
                            className="
                        py-0 mt-6
  group
  transition-all duration-300 ease-in-out
  hover:bg-black
"
                        >
                            <CardContent className="flex items-center gap-4 p-4">
                                <Avatar>
                                    <AvatarFallback
                                        className="
          bg-gray-200 text-black
          transition-colors duration-300
          group-hover:bg-white group-hover:text-black
        "
                                    >
                                        AC
                                    </AvatarFallback>
                                </Avatar>

                                <span
                                    className="
      text-sm font-medium
      text-gray-900
      transition-colors duration-300
      group-hover:text-white
    "
                                >
                                    Alex Carry
                                </span>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </Card>
    );
}
