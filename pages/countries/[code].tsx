import { GetServerSideProps } from 'next'
import { ParsedUrlQuery } from 'querystring'

interface Params extends ParsedUrlQuery {
  code: string
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/countries',
      permanent: false,
    },
  }
}

export default function CountryDetailPage() {
  return null
} 