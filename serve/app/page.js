import Navbar        from '@/components/Navbar'
import Hero          from '@/components/Hero'
import Ticker        from '@/components/Ticker'
import Problem       from '@/components/Problem'
import Features      from '@/components/Features'
import HowItWorks    from '@/components/HowItWorks'
import Pricing       from '@/components/Pricing'
import Stories       from '@/components/Stories'
import About         from '@/components/About'
import Faq           from '@/components/Faq'
import Contact       from '@/components/Contact'
import Footer        from '@/components/Footer'
import WhatsAppFloat from '@/components/WhatsAppFloat'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Ticker />
        <Problem />
        <Features />
        <HowItWorks />
        <Pricing />
        <Stories />
        <About />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  )
}