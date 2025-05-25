import { PortableText } from '@portabletext/react'
import { client } from '@/sanity/lib/client'
import { groq } from 'next-sanity'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'About Us | TariffAlert.me',
  description: 'Learn about TariffAlert.me - your trusted companion for monitoring and optimizing electricity tariffs.',
}

async function getPageContent() {
  try {
    const content = await client.fetch(groq`*[_type == "page" && slug.current == "about-us-tariff-alert-www-tariffalert-me"][0]{
      title,
      description,
      shortDescription,
      showContactForm
    }`)
    if (!content) {
      throw new Error('Page not found')
    }
    return content
  } catch (error) {
    console.error('Error fetching about page content:', error)
    throw error
  }
}

async function handleContactSubmit(formData: FormData) {
  'use server'
  
  const name = formData.get('name')
  const email = formData.get('email')
  const message = formData.get('message')
  
  // TODO: Implement your form submission logic here
  // For example, send to an API endpoint or email service
  console.log('Form submitted:', { name, email, message })
}

export default async function AboutPage() {
  let pageContent
  
  try {
    pageContent = await getPageContent()
  } catch (error) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-white" role="main">
      <section className="py-16 bg-gradient-to-b from-primary-50 to-white animate-fadeIn">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl font-bold text-center text-primary-800 mb-8">
            {pageContent?.title || 'About TariffAlert.me'}
          </h1>
          
          {pageContent?.shortDescription && (
            <p className="text-xl text-gray-700 text-center mb-8 animate-slideUp">
              {pageContent.shortDescription}
            </p>
          )}

          <div className="prose prose-lg mx-auto animate-slideUp">
            {pageContent?.description && (
              <PortableText value={pageContent.description} />
            )}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      {pageContent?.showContactForm && (
        <section className="py-16 bg-white animate-fadeIn" aria-labelledby="contact-heading">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 id="contact-heading" className="text-3xl font-semibold text-primary-800 mb-8">Contact Us</h2>
            <form action={handleContactSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  required
                  aria-required="true"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Send Message
              </button>
            </form>
          </div>
        </section>
      )}
    </main>
  )
} 