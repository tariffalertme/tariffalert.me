import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Products',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Product Name',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'imageUrl',
      title: 'Product Image URL',
      type: 'url',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'imageAlt',
      title: 'Image Alt Text',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Important for SEO and accessibility.'
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.required().positive()
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'tag'}]
      }],
      validation: (Rule) => Rule.required().min(1)
    }),
    defineField({
      name: 'countryOfOrigin',
      title: 'Country of Origin',
      type: 'reference',
      to: [{type: 'countryProfile'}],
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'url',
      title: 'Product URL',
      type: 'url',
      validation: (Rule) => Rule.required()
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'price',
      tags: 'tags'
    },
    prepare({title, subtitle = 0, tags = []}) {
      return {
        title,
        subtitle: `$${subtitle.toFixed(2)} - ${Array.isArray(tags) ? tags.map(tag => tag.name).join(', ') : ''}`
      }
    }
  }
}) 