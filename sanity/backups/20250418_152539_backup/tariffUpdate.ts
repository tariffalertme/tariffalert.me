import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'tariffUpdate',
  title: 'Tariff Updates',
  type: 'document',
  fields: [
    defineField({
      name: 'imposingCountry',
      title: 'Country Imposing Tariff',
      type: 'reference',
      to: [{type: 'countryProfile'}],
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'impactedCountry',
      title: 'Impacted Country',
      type: 'reference',
      to: [{type: 'countryProfile'}],
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'effectiveDate',
      title: 'Effective Date',
      type: 'date',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'type',
      title: 'Update Type',
      type: 'string',
      options: {
        list: [
          {title: 'New Tariff', value: 'new'},
          {title: 'Modification', value: 'modification'},
          {title: 'Removal', value: 'removal'}
        ]
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'productCategories',
      title: 'Affected Product Categories',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'countryProfile'}]}],
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'previousRate',
      title: 'Previous Rate',
      type: 'number',
      description: 'Previous tariff rate as a percentage'
    }),
    defineField({
      name: 'newRate',
      title: 'New Rate',
      type: 'number',
      description: 'New tariff rate as a percentage'
    }),
    defineField({
      name: 'impact',
      title: 'Estimated Impact',
      type: 'object',
      fields: [
        defineField({
          name: 'severity',
          title: 'Impact Severity',
          type: 'string',
          options: {
            list: [
              {title: 'Low', value: 'low'},
              {title: 'Medium', value: 'medium'},
              {title: 'High', value: 'high'}
            ]
          }
        }),
        defineField({
          name: 'description',
          title: 'Impact Description',
          type: 'text',
          rows: 3
        })
      ]
    }),
    defineField({
      name: 'source',
      title: 'Information Source',
      type: 'url',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'details',
      title: 'Additional Details',
      type: 'array',
      of: [{type: 'block'}]
    })
  ],
  preview: {
    select: {
      imposingCountry: 'imposingCountry.name',
      impactedCountry: 'impactedCountry.name',
      type: 'type'
    },
    prepare({imposingCountry, impactedCountry, type}) {
      return {
        title: `${imposingCountry} → ${impactedCountry}`,
        subtitle: `${type}`
      }
    }
  }
}) 