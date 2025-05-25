import React from 'react'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'country',
  title: 'Countries',
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
      title: 'Flag URL',
      type: 'url',
      description: 'URL to the full-size country flag image (recommended: https://flagcdn.com/w1280/{code}.png)',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'flagIconUrl',
      title: 'Flag Icon URL',
      type: 'url',
      description: 'URL to a smaller icon version of the flag (recommended: https://flagcdn.com/32x24/{code}.png)',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'tags',
      title: 'Country Tags',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'tag'}],
        options: {
          filter: 'type == "country"'
        }
      }],
      validation: (Rule) => Rule.custom((tags, context) => {
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
          return 'At least one country tag is required'
        }
        return true
      })
    }),
    defineField({
      name: 'majorExports',
      title: 'Major Exports',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'tag'}],
        options: {
          filter: 'type == "industry"'
        }
      }],
      validation: (Rule) => Rule.custom((tags, context) => {
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
          return 'At least one industry tag is required'
        }
        return true
      }),
      description: 'Major export industries (must be industry tags)'
    }),
    defineField({
      name: 'productCategories',
      title: 'Product Categories',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'tag'}],
        options: {
          filter: 'type == "product_category"'
        }
      }],
      validation: (Rule) => Rule.custom((tags, context) => {
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
          return 'At least one product category tag is required'
        }
        return true
      }),
      description: 'Product categories manufactured in this country'
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'code',
      flagIcon: 'flagIconUrl'
    },
    prepare({title, subtitle, flagIcon}) {
      return {
        title,
        subtitle: `${subtitle}`,
        media: () => React.createElement('img', {
          src: flagIcon,
          alt: `Flag of ${title}`,
          style: { objectFit: 'contain' }
        })
      }
    }
  }
}) 