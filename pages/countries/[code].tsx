import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { getCountryByCode, getProductsByCountry, getCountryTariffHistory } from '@/lib/sanity/queries'
import Image from 'next/image'
import SparklineChart from '@/components/ui/SparklineChart'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const code = (context.params?.code as string)?.toUpperCase()
  if (!code) {
    return { notFound: true }
  }
  const [country, products, historyData] = await Promise.all([
    getCountryByCode(code),
    getProductsByCountry(code),
    getCountryTariffHistory(code)
  ])
  if (!country) {
    return { notFound: true }
  }
  return { props: { country, products, historyData } }
}

export default function CountryDetailPage({ country, products, historyData }: { country: any, products: any[], historyData: any[] }) {
  if (!country) return null
  const latestRate = historyData.length > 0 ? Math.max(...historyData.map(h => h.rate)) : 0
  return (
    <>
      <Head>
        <title>{country.name} - Tariff Details | TariffAlert.me</title>
        <meta name="description" content={`Tariff and trade details for ${country.name}.`} />
        <link rel="canonical" href={`https://tariffalert.me/countries/${country.code}`} />
      </Head>
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-6 mb-8">
            <Image src={country.flagIconUrl} alt={`${country.name} flag`} width={48} height={32} className="object-contain border" />
            <h1 className="text-3xl font-bold">{country.name} ({country.code})</h1>
          </div>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Products Imported From This Country</h2>
            {products.length === 0 ? (
              <div className="text-gray-500 italic">No products found for this country.</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {products.map((product) => (
                  <div key={product._id} className="flex-shrink-0 flex flex-col items-center border rounded-lg p-4 bg-white h-full w-32 sm:w-40 overflow-hidden">
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 mb-2 overflow-hidden">
                      <Image src={product.image.asset.url} alt={product.name} fill className="object-contain rounded" />
                    </div>
                    <h5 className="font-medium text-sm text-center line-clamp-2">{product.name}</h5>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2 text-center">{product.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Major Exports</h2>
            {country.majorExports && country.majorExports.length > 0 ? (
              <ul className="list-disc ml-6">
                {country.majorExports.map((exp: any) => (
                  <li key={exp._id}>{exp.name}</li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic">No major exports listed.</div>
            )}
          </div>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Tariff Rate History</h2>
            {historyData.length > 0 ? (
              <div className="max-w-xl">
                <SparklineChart data={historyData} width={400} height={80} showTooltip color="#2563eb" />
              </div>
            ) : (
              <div className="text-gray-500 italic">No tariff history available.</div>
            )}
          </div>
        </div>
      </main>
    </>
  )
} 