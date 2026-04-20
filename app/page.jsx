import Herosection from "@/components/hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { featuresData, howItWorksData, statsData, testimonialsData } from "@/data/landing";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

export default function Home() {
  return (
    <div className="mt-40">
      <Herosection />

      {/* Stats Section */}
      <section className="py-20 bg-blue-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything you need to manage your finances
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Powerful tools designed to give you complete control over your financial life.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresData.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300 dark:border-gray-800">
                <CardContent className="space-y-4 pt-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-blue-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Get up and running in minutes. No complex setup required.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {howItWorksData.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Trusted by thousands of individuals and businesses worldwide.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonialsData.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300 dark:border-gray-800">
                <CardContent className="pt-4">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={44}
                      height={44}
                      className="rounded-full object-cover"
                    />
                    <div className="ml-3">
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
            Join thousands of users already managing their money smarter with WealthIn.
            Start for free — no credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 cursor-pointer px-8"
              >
                Start Free Today
              </Button>
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-4">No credit card required · Cancel anytime</p>
        </div>
      </section>
    </div>
  );
}
