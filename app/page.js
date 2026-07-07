import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { creditBenefits, features, testimonials } from "@/lib/data";

export default function Home() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-35 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 px-5">
              <Badge
                variant="outline"
                className="bg-emerald-500/10 border-emerald-500/30 px-4 py-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium"
              >
                Healthcare Made Simple
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Digital Doctor <br />
                <span className="gradient-title block text-3xl leading-snug">
                  Connect with Doctors Anytime, Anywhere
                </span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-md">
                Book Appointments, Consult via Video, and Manage your Healthcare
                Journey All in One Secure Platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Link href="/onboarding">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-emerald-700/30 hover:bg-muted/80"
                >
                  <Link href="/doctors">Find Doctors</Link>
                </Button>
              </div>
            </div>

            <div className="relative h-[300px] lg:h-[400px] mx-5 rounded-xl overflow-hidden">
              <Image
                src="/banner.webp"
                alt="Doctor Consultation"
                fill
                priority
                className="object-cover rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our Platform Makes Healthcare Accessible with Just a Few Clicks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-card border-emerald-900/20 hover:border-emerald-800/40 transition-all duration-300"
              >
                <CardHeader className="pb-2">
                  <div className="bg-emerald-500/10 dark:bg-emerald-900/20 p-3 rounded-lg w-fit mb-2">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground mb-[-20px]">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 border-emerald-500/30 px-4 py-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4"
            >
              Affordable Healthcare
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Consultation Packages
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the Perfect Consultation Package that Fits your Healthcare
              Needs
            </p>
          </div>

          <div className="mx-auto">
            {/* Description */}
            <Card className="mt-12 bg-muted/20 border-emerald-900/30 px-5">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-emerald-400" />
                  How Our Credit System Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {creditBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <div className="mr-3 mt-1 bg-emerald-500/10 dark:bg-emerald-900/20 p-1 rounded-full">
                        <svg
                          className="h-4 w-4 text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                      </div>
                      <p
                        className="text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: benefit }}
                      />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 border-emerald-500/30 px-4 py-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4"
            >
              Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Our Users Say
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Hear from Patients and Doctors who use our Platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-emerald-900/20 hover:border-emerald-800/40 transition-all"
              >
                <CardContent className="pt-1">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-900/20 flex items-center justify-center mr-4">
                      <span className="text-emerald-400 font-bold">
                        {testimonial.initials}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    &quot;{testimonial.quote}&quot;
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 dark:from-emerald-900/30 dark:to-emerald-950/20 border-emerald-500/20 dark:border-emerald-800/20">
            <CardContent className="p-8 md:p-12 lg:p-16 relative overflow-hidden">
              <div className="max-w-2xl relative z-1">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Ready to Take Control of Your Healthcare?
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join Thousands of Users who have Simplified their Healthcare
                  Journey with our Platform. Experience Healthcare the Way it
                  Should be!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Link href="/sign-up">Sign Up Now</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-emerald-700/30 hover:bg-muted/80"
                  >
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>

              <div className="absolute right-0 top-0 w-[300px] h-[300px] bg-emerald-800/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="absolute left-0 bottom-0 w-[200px] h-[200px] bg-emerald-700/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
