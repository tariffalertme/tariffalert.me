import CountryGridClient from './CountryGridClient'
import { Country } from '@/lib/sanity/queries'

interface CountryGridProps {
  countries: Country[]
  showTitle?: boolean
  limit?: number
}

export default function CountryGrid(props: CountryGridProps) {
  return <CountryGridClient {...props} />
} 