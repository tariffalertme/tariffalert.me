import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'countryProfile',
  title: 'Country Profiles',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Country Name',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'code',
      title: 'Country Code',
      type: 'string',
      validation: (Rule) => Rule.required().length(2),
      description: 'ISO 2-letter country code (e.g., US, CN, DE)'
    }),
    defineField({
      name: 'flagUrl',
      title: 'Flag Image URL',
      type: 'url',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'majorExports',
      title: 'Major Exports',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'tag'}]
      }],
      description: 'Tag major export categories/products'
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'code'
    }
  }
}) 