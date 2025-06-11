"use client"
import React  from 'react'
import Link from 'next/link'
import { useEffect,useRef } from 'react'
import { Button } from './ui/button'
import Image from 'next/image'

const Herosection = () => {

    const imageRef = useRef();

    useEffect(()=>{
        const imageElement = imageRef.current;

        const handleScroll=()=>{
            const scrollposition = window.scrollY;
            const scrollThreshold = 100;

            if(scrollposition>scrollThreshold){
                imageElement.classList.add("scrolled");
            }else{
                imageElement.classList.remove("scrolled")
            }
        }

        window.addEventListener("scroll",handleScroll)

        return()=> window.removeEventListener("scroll",handleScroll);
    },[]) // [] means it will run only once

  return (
    <section className='pb-20 px-4 '>
        <div className='container mx-auto text-center'>
            <h1 className='text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title'>
                Manage Your Finances <br/>with Intelligence
            </h1>
            <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
                An AI-powered financial management platform that helps you track,
                analyze,and optimize your spending with real-time insights.
            </p>
            <div className='flex justify-center space-x-4'>
                <Link href="/dashboard">
                <Button size="lg" className="px-8 cursor-pointer">
                    Get Started
                </Button>
                </Link>
                
                <Button size="lg" variant="outline" className="px-8 cursor-pointer" onClick={() => window.open("https://portfolio-namanchaturvediis-projects.vercel.app/", "_blank")}>
                    About Me
                </Button>
                
                </div>
                <div className='hero-image-wrapper  mt-5 md:mt-0'>
                    <div ref={imageRef} className='hero-image' >
                        <Image src='/banner11.png' width={1200} height={720} className='rounded-lg shadow-2xl border mx-auto' priority alt='Dashboard image'/>
                    </div>
                </div>
            
        </div>
    </section>
  )
}

export default Herosection