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
      validation: (Rule) => Rule.required(),
      readOnly: true
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
      name: 'category',
      title: 'Product Category',
      type: 'reference',
      to: [{type: 'productCategory'}],
      validation: (Rule) => Rule.required()
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
      category: 'category.name',
      tags: 'tags'
    },
    prepare({title, subtitle = 0, category = '', tags = []}) {
      return {
        title,
        subtitle: `${category} - $${subtitle.toFixed(2)} - ${Array.isArray(tags) ? tags.map(tag => tag.name).join(', ') : ''}`
      }
    }
  }
}) 