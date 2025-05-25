import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2023-05-03',
  useCdn: process.env.NODE_ENV === 'production',
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

export async function getProduct(id: string) {
  return await client.fetch(
    `*[_type == "product" && _id == $id][0]`,
    { id }
  )
}

export async function getAllProducts() {
  return await client.fetch(`*[_type == "product"] {
    _id,
    name,
    price,
    description,
    "image": image.asset->url
  }`)
} 