import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Eye, 
  Calendar,
  User,
  Hash,
  Filter,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

const PassTable = ({ passes, onViewPass }) => {
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const isExpired = (pass) => {
    if (!pass.validUntil) return false;
    return new Date() > new Date(pass.validUntil);
  };

  const statusOptions = [
    { value: 'all', label: 'All Passes', count: passes.length },
    { value: 'active', label: 'Active', count: passes.filter(p => !isExpired(p) && !p.used).length },
    { value: 'used', label: 'Used', count: passes.filter(p => p.used).length },
    { value: 'expired', label: 'Expired', count: passes.filter(p => isExpired(p) && !p.used).length },
    { value: 'sent', label: 'Sent', count: passes.filter(p => p.sentStatus).length },
    { value: 'pending', label: 'Pending', count: passes.filter(p => !p.sentStatus).length }
  ];

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (pass) => {
    // Priority: Used > Expired > Sent > Pending
    if (pass.used) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Used
        </span>
      );
    }
    
    if (isExpired(pass)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    }
    
    if (pass.sentStatus) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Sent
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedPasses = () => {
    let filtered = passes;
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(pass => {
        if (filterStatus === 'active') return !isExpired(pass) && !pass.used;
        if (filterStatus === 'used') return pass.used;
        if (filterStatus === 'expired') return isExpired(pass) && !pass.used;
        if (filterStatus === 'sent') return pass.sentStatus;
        if (filterStatus === 'pending') return !pass.sentStatus;
        return true;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle date sorting
      if (sortField === 'createdAt' || sortField === 'sentAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const sortedPasses = filteredAndSortedPasses();

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header with Filters */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Pass Logs</h3>
            <span className="text-sm text-gray-500">
              {sortedPasses.length} of {passes.length} passes
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm">Filter</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showFilters && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-2">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterStatus(option.value);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                          filterStatus === option.value ? 'bg-red-50 text-pre-red' : 'text-gray-700'
                        }`}
                      >
                        <span>{option.label}</span>
                        <span className="text-xs text-gray-500">({option.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => handleSort('id')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <Hash className="h-3 w-3" />
                  <span>Pass ID</span>
                </div>
              </th>
              <th 
                onClick={() => handleSort('userName')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>User</span>
                </div>
              </th>
              <th 
                onClick={() => handleSort('guestName')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>Guest Name</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th 
                onClick={() => handleSort('validUntil')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Valid Until</span>
                </div>
              </th>
              <th 
                onClick={() => handleSort('createdAt')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Created</span>
                </div>
              </th>
              <th 
                onClick={() => handleSort('sentAt')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                Sent Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPasses.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No passes found</h3>
                    <p className="text-gray-500">
                      {filterStatus === 'all' 
                        ? 'No guest passes have been generated yet.'
                        : `No ${filterStatus} passes found.`
                      }
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedPasses.map((pass) => (
                <tr key={pass.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {pass.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pass.userName}</div>
                    <div className="text-xs text-gray-500">{pass.unit || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{pass.guestName || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{pass.purpose || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(pass)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(pass.validUntil)}</div>
                    {isExpired(pass) && !pass.used && (
                      <div className="text-xs text-red-600 font-medium">Expired</div>
                    )}
                    {pass.used && pass.usedAt && (
                      <div className="text-xs text-blue-600 font-medium">Used: {formatDate(pass.usedAt)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(pass.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pass.sentStatus ? formatDate(pass.sentAt) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewPass && onViewPass(pass)}
                      className="text-pre-red hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (if needed) */}
      {sortedPasses.length > 50 && (
        <div className="bg-white px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{sortedPasses.length}</span> of{' '}
              <span className="font-medium">{passes.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassTable;
