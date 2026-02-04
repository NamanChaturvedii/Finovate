import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { LayoutDashboard, PenBox } from 'lucide-react'
import { checkUser } from '@/lib/checkUser'

const Header = async () => {
    await checkUser();
    return (
        <header className='fixed-top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b '>
            <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center">
                    <Image
                        src="/logo.png"
                        alt="wealth logo"
                        width={120}
                        height={32}
                        className="object-contain sm:w-[170px] sm:h-[40px]"
                        priority
                    />
                </Link>
                <div className='flex items-center space-x-4'>
                    <SignedIn>
                        <Link href="/dashboard" className='text-gray-600 hover:text-blue-600 flex items-center gap-2'>
                            <Button variant="outline">
                                <LayoutDashboard size={18} />
                                <span className='hidden md:inline cursor-pointer'>Dashboard</span>
                            </Button>
                        </Link>

                        <Link href={"/transaction/create"}>
                            <Button className="flex items-center gap-2">
                                <PenBox size={18} />
                                <span className='hidden md:inline  cursor-pointer'>Add Transaction</span>
                            </Button>
                        </Link>

                    </SignedIn>

                    <SignedOut>
                        <SignInButton forceRedirectUrl='/dashboard'>
                            <Button variant="outline" className='cursor-pointer'>Login</Button>
                        </SignInButton >
                    </SignedOut>
                    <SignedIn>
                        <UserButton appearance={{
                            elements: {
                                avatarBox: "w-10 h-10",
                            }
                        }} />
                    </SignedIn>
                </div>


            </nav>
        </header>
    )
}

export default Header