import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'rateHistory',
  title: 'Rate History',
  type: 'object',
  fields: [
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'rate',
      title: 'Rate (%)',
      type: 'number',
      validation: (Rule) => Rule.min(0).required()
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      description: 'Optional notes about this historical rate'
    })
  ],
  preview: {
    select: {
      date: 'date',
      rate: 'rate'
    },
    prepare({ date, rate }) {
      const formattedDate = date ? new Date(date).toLocaleDateString() : 'No date';
      return {
        title: `${rate}% on ${formattedDate}`,
      }
    }
  }
}) 