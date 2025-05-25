'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'
import { Product } from '@/lib/sanity/queries'

interface DrilldownTableProps {
  products: Product[]
  onRowClick?: (product: Product) => void
}

export default function DrilldownTable({ products, onRowClick }: DrilldownTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (productId: string) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(productId)) {
      newExpandedRows.delete(productId)
    } else {
      newExpandedRows.add(productId)
    }
    setExpandedRows(newExpandedRows)
  }

  const getLatestTariffRate = (product: Product): number => {
    if (!product.relatedTariffUpdates?.length) return 0
    const latestUpdate = product.relatedTariffUpdates.reduce((latest, current) => 
      new Date(current.effectiveDate) > new Date(latest.effectiveDate) ? current : latest
    )
    return latestUpdate?.newRate || 0
  }

  if (!products?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No products available
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="w-8 px-3 py-3"></th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Latest Rate
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Categories
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Impact Score
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => {
            const isExpanded = expandedRows.has(product._id)
            return (
              <>
                <tr 
                  key={product._id}
                  className={`hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                  onClick={() => toggleRow(product._id)}
                >
                  <td className="px-3 py-4">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center">
                      {product.image?.asset?.url ? (
                        <Image
                          src={product.image.asset.url}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-md"
                          unoptimized
                        />
                      ) : null}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getLatestTariffRate(product)}%
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-1">
                      {product.tags?.map((tag) => (
                        <span
                          key={tag._id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center">
                      <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${product.impactScore * 10}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm text-gray-500">{product.impactScore}/10</span>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-3 py-4">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900">Tariff History</h4>
                        <div className="space-y-2">
                          {product.relatedTariffUpdates?.map((update) => (
                            <div key={update._id} className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-2">
                                {update.country?.code && (
                                  <Image
                                    src={`https://flagcdn.com/24x18/${update.country.code.toLowerCase()}.png`}
                                    alt={`${update.country.name} flag`}
                                    width={24}
                                    height={18}
                                    className="rounded-sm"
                                    unoptimized
                                  />
                                )}
                                <span className="font-medium">{update.country?.name}</span>
                              </div>
                              <span className="text-gray-500">
                                {format(new Date(update.effectiveDate), 'MMM d, yyyy')}
                              </span>
                              <span className="font-medium text-blue-600">{update.newRate}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
} 