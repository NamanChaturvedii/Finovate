import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { LayoutDashboard, PenBox, TrendingUp } from 'lucide-react'
import { checkUser } from '@/lib/checkUser'
import { ThemeToggle } from './theme-toggle'

const Header = async () => {
    await checkUser();
    return (
        <header className='fixed top-0 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50 border-b dark:border-gray-800'>
            <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <TrendingUp size={16} className="text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        WealthIn
                    </span>
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

                    <ThemeToggle />

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