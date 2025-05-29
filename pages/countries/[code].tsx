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
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center gap-4 mb-10">
            <Image src={country.flagIconUrl} alt={`${country.name} flag`} width={64} height={42} className="object-contain border shadow" />
            <h1 className="text-4xl font-extrabold text-center">{country.name} <span className="text-lg font-semibold text-gray-500">({country.code})</span></h1>
          </div>
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Products Imported From This Country</h2>
            {products.length === 0 ? (
              <div className="text-gray-500 italic">No products found for this country.</div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
                {products.map((product) => (
                  <div key={product._id} className="flex-shrink-0 w-48 sm:w-56 bg-white border rounded-xl shadow p-4 flex flex-col items-center snap-center transition-transform hover:scale-105">
                    <div className="relative w-28 h-28 mb-2 overflow-hidden flex items-center justify-center bg-gray-100 rounded">
                      <Image src={product.image.asset.url} alt={product.name} width={112} height={112} className="object-contain rounded max-w-full max-h-full" />
                    </div>
                    <h5 className="font-semibold text-base text-center line-clamp-2 mb-1">{product.name}</h5>
                    <p className="text-xs text-gray-500 line-clamp-2 text-center">{product.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Major Exports</h2>
            {country.majorExports && country.majorExports.length > 0 ? (
              <ul className="list-disc ml-8 text-base text-gray-700">
                {country.majorExports.map((exp: any) => (
                  <li key={exp._id}>{exp.name}</li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic">No major exports listed.</div>
            )}
          </div>
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Tariff Rate History</h2>
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