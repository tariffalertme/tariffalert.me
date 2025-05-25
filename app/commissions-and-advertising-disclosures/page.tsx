import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Commissions and Advertising Disclosures | TariffAlert.me',
  description: 'Learn about our affiliate commissions, advertising policies, and how we maintain editorial independence at TariffAlert.me.'
}

export default function CommissionsAndAdvertisingDisclosuresPage() {
  return (
    <main className="min-h-screen bg-white" role="main">
      <section className="py-16 bg-gradient-to-b from-primary-50 to-white animate-fadeIn">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl font-bold text-center text-primary-800 mb-8">
            Commissions and Advertising Disclosures
          </h1>
          <div className="prose prose-lg mx-auto animate-slideUp">
            <p>
              TariffAlert.me may earn affiliate commissions when you click links to partner retailers and make purchases. These commissions help support the operation and development of this website, at no additional cost to you.
            </p>
            <p>
              We are committed to editorial independence. Our product recommendations, news coverage, and tariff analysis are based on objective research and are never influenced by affiliate partnerships or advertisers.
            </p>
            <p>
              Sponsored content and advertisements, if present, will always be clearly labeled. We do not accept payment for positive reviews or preferential placement of products.
            </p>
            <p>
              For questions about our advertising or affiliate policies, please <a href="/about" className="text-primary-600 underline">contact us</a>.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
} 