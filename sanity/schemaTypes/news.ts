import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'news',
  title: 'News Articles',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(10).max(200)
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 200
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'category',
      title: 'Legacy Category (Old)',
      type: 'string',
      options: {
        list: [
          {title: 'Trade', value: 'trade'},
          {title: 'Tariffs', value: 'tariffs'},
          {title: 'Industry', value: 'industry'},
          {title: 'Electronics', value: 'electronics'},
          {title: 'Automotive', value: 'automotive'}
        ]
      }
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
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for SEO and accessibility.'
        }
      ]
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(300)
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block'
        },
        {
          type: 'image',
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
              description: 'Important for SEO and accessibility.'
            }
          ]
        }
      ]
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    }),
    defineField({
      name: 'featured',
      title: 'Featured Article',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'relatedTariffUpdate',
      title: 'Related Tariff Update',
      type: 'reference',
      to: [{ type: 'tariffUpdate' }],
      description: 'The most relevant tariff update for this news article'
    })
  ],
  preview: {
    select: {
      title: 'title',
      tags: 'tags',
      media: 'mainImage'
    },
    prepare({title, tags = [], media}) {
      return {
        title,
        subtitle: Array.isArray(tags) ? tags.map(tag => tag.name).join(', ') : '',
        media
      }
    }
  }
}) 