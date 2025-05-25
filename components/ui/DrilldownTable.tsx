import React from 'react';

interface TariffDetail {
  country: string;
  rate: number;
  effectiveDate: string;
}

interface DrilldownTableProps {
  tariffs: TariffDetail[];
}

const DrilldownTable: React.FC<DrilldownTableProps> = ({ tariffs }) => {
  if (!tariffs || tariffs.length === 0) {
    return <p className="text-gray-500">No tariff details available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Country
            </th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rate
            </th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Effective Date
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tariffs.map((tariff, index) => (
            <tr key={index}>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{tariff.country}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{tariff.rate}%</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                {new Date(tariff.effectiveDate).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DrilldownTable; 