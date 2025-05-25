import {defineField, defineType} from 'sanity'
import rateHistory from './rateHistory' // Import the rateHistory schema

export default defineType({
  name: 'tariffUpdate',
  title: 'Tariff Updates',
  type: 'document',
  fields: [
    defineField({
      name: 'imposingCountry',
      title: 'Country Imposing Tariff',
      type: 'reference',
      to: [{type: 'country'}],
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'impactedCountry',
      title: 'Impacted Country',
      type: 'reference',
      to: [{type: 'country'}],
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'effectiveDate',
      title: 'Effective Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
      description: 'The date when this tariff change takes effect'
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
      name: 'affectedCategories',
      title: 'Affected Product Categories',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'tag'}],
        options: {
          filter: 'type == "product_category" || type == "industry"'
        }
      }],
      validation: (Rule) => Rule.required(),
      description: 'Select product categories or industries affected by this tariff update'
    }),
    defineField({
      name: 'newRate',
      title: 'New Rate (%)',
      type: 'number',
      description: 'New tariff rate as a percentage. Required for \'New\' or \'Modification\' types.',
      validation: (Rule) => Rule.custom((newRate, context) => {
        const documentType = context.document?.type as string | undefined;
        if (documentType === 'new' || documentType === 'modification') {
          if (newRate === undefined || newRate === null) {
            return 'New Rate is required for this update type.';
          }
          if (typeof newRate !== 'number' || newRate < 0) {
            return 'Rate must be a non-negative number.';
          }
        }
        return true; 
      })
    }),
    defineField({
      name: 'history',
      title: 'Rate History',
      type: 'array',
      of: [{ type: 'rateHistory' }],
      description: 'Historical record of rates for this tariff context. The first entry\'s date will be considered the announcement date.',
      validation: (Rule) => Rule.custom((history, context: any) => {
        // For new tariffs, ensure at least one history entry
        if (context.document?.type === 'new' && (!history || history.length === 0)) {
          return 'New tariffs must have at least one rate history entry';
        }
        return true;
      })
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
      type: 'type',
      effectiveDate: 'effectiveDate'
    },
    prepare({imposingCountry, impactedCountry, type, effectiveDate}) {
      const date = effectiveDate ? new Date(effectiveDate).toLocaleDateString() : 'No date';
      return {
        title: `${imposingCountry} → ${impactedCountry}`,
        subtitle: `${type} (Effective: ${date})`
      }
    }
  }
}) 