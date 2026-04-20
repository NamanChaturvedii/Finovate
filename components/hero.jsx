"use client"
import React from 'react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Button } from './ui/button'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'

const Herosection = () => {
    const imageRef = useRef();

    useEffect(() => {
        const imageElement = imageRef.current;
        const handleScroll = () => {
            const scrollposition = window.scrollY;
            if (scrollposition > 100) {
                imageElement.classList.add("scrolled");
            } else {
                imageElement.classList.remove("scrolled")
            }
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll);
    }, [])

    return (
        <section className='pb-20 px-4'>
            <div className='container mx-auto text-center'>
                {/* Trust badge */}
                <div className='inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-1.5 mb-6 text-sm text-blue-700 dark:text-blue-300'>
                    <Sparkles size={14} />
                    <span>AI-Powered Finance Management</span>
                </div>

                <h1 className='text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title'>
                    Manage Your Finances <br />with Intelligence
                </h1>
                <p className='text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto'>
                    Track, analyze, and optimize your spending with smart receipt scanning,
                    real-time analytics, and AI-powered insights — all in one place.
                </p>

                <div className='flex flex-col sm:flex-row justify-center gap-4 mb-4'>
                    <Link href="/dashboard">
                        <Button size="lg" className="px-8 cursor-pointer gap-2">
                            Get Started Free
                            <ArrowRight size={16} />
                        </Button>
                    </Link>
                    <Button
                        size="lg"
                        variant="outline"
                        className="px-8 cursor-pointer"
                        onClick={() => window.open("https://portfolio-namanchaturvediis-projects.vercel.app/", "_blank")}
                    >
                        About Me
                    </Button>
                </div>

                <p className='text-sm text-gray-500 dark:text-gray-500 mb-8'>No credit card required · Free forever plan</p>

                <div className='hero-image-wrapper mt-5 md:mt-0'>
                    <div ref={imageRef} className='hero-image'>
                        <Image
                            src='/main1.png'
                            width={1000}
                            height={720}
                            className='rounded-xl shadow-2xl border dark:border-gray-700 mx-auto w-[79%]'
                            priority
                            alt='Dashboard preview'
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Herosection
