import arcjet, { createMiddleware, detectBot, shield } from '@arcjet/next';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectRoutes= createRouteMatcher([
    "/dashboard(.*)",
    "/account(.*)",
    "/transcation(.*)",

])


const aj = arcjet({
  key:process.env.ARCJET_KEY,
  rules:[
    shield({
      mode:"LIVE"
    }),
    detectBot({
      mode:"LIVE",
      allow:[
        "CATEGORY:SEARCH_ENGINE",
        "GO_HTTP",
      ]
    })
  ]
})


const clerk =  clerkMiddleware(async(auth,req)=>{
    const {userId}= await auth();

    if(!userId && isProtectRoutes(req)){
        const {redirectToSignIn}= await auth();

        return redirectToSignIn();

    }


});

export default createMiddleware(aj,clerk);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}