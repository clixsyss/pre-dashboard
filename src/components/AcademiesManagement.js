import React, { useState, useEffect } from 'react';
import {
  Users,
  MapPin,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  School,
  Phone,
  Mail,
  Award
} from 'lucide-react';
import { useAcademyStore } from '../stores/academyStore';

const AcademiesManagement = ({ projectId }) => {
  // Academy store integration
  const {
    academyOptions: projectAcademies,
    fetchAcademies,
    loading: academiesLoading,
    error: academiesError,
    addAcademy,
    updateAcademy,
    deleteAcademy,
    addProgram,
    updateProgram,
    deleteProgram
  } = useAcademyStore();

  // State management
  const [academySearchTerm, setAcademySearchTerm] = useState('');
  const [academyTypeFilter, setAcademyTypeFilter] = useState('all');
  const [academyRatingFilter, setAcademyRatingFilter] = useState('all');
  const [selectedAcademyForModal, setSelectedAcademyForModal] = useState(null);
  const [isAcademyModalOpen, setIsAcademyModalOpen] = useState(false);
  const [isAddAcademyModalOpen, setIsAddAcademyModalOpen] = useState(false);
  const [selectedAcademyForPrograms, setSelectedAcademyForPrograms] = useState(null);
  const [isProgramsModalOpen, setIsProgramsModalOpen] = useState(false);
  const [isEditProgramModalOpen, setIsEditProgramModalOpen] = useState(false);
  const [selectedProgramForEdit, setSelectedProgramForEdit] = useState(null);
  const [isViewProgramModalOpen, setIsViewProgramModalOpen] = useState(false);
  const [selectedProgramForView, setSelectedProgramForView] = useState(null);
  
  // Form state for academy creation/editing
  const [academyFormData, setAcademyFormData] = useState({
    name: '',
    type: 'sports',
    establishedYear: '',
    rating: 0,
    description: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    capacity: 0,
    operatingHours: '',
    facilities: ''
  });

  // Form state for program creation/editing
  const [programFormData, setProgramFormData] = useState({
    name: '',
    category: '',
    ageGroup: '',
    duration: '',
    price: '',
    maxCapacity: '',
    description: '',
    days: [],
    timeSlots: [], // Keep for backward compatibility
    timeSlotsByDay: {},
    coaches: []
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch academies when component mounts
  useEffect(() => {
    if (projectId) {
      console.log('Fetching academies for project:', projectId);
      fetchAcademies(projectId);
    }
  }, [projectId, fetchAcademies]);

  // Debug effect to see when academies change
  useEffect(() => {
    console.log('Academies data changed:', { projectAcademies, length: projectAcademies?.length });
  }, [projectAcademies]);

  // Debug effect to see when form data changes
  useEffect(() => {
    console.log('Form data changed:', academyFormData);
  }, [academyFormData]);

  // Filter academies based on search and filters
  const getFilteredAcademies = () => {
    console.log('getFilteredAcademies called with:', { projectAcademies, length: projectAcademies?.length });
    if (!projectAcademies || projectAcademies.length === 0) return [];
    
    let filtered = [...projectAcademies];

    if (academySearchTerm) {
      filtered = filtered.filter(academy =>
        (academy.name && academy.name.toLowerCase().includes(academySearchTerm.toLowerCase())) ||
        (academy.description && academy.description.toLowerCase().includes(academySearchTerm.toLowerCase())) ||
        (academy.location && academy.location.toLowerCase().includes(academySearchTerm.toLowerCase())) ||
        (academy.email && academy.email.toLowerCase().includes(academySearchTerm.toLowerCase()))
      );
    }

    if (academyTypeFilter !== 'all') {
      filtered = filtered.filter(academy => academy.type === academyTypeFilter);
    }

    if (academyRatingFilter !== 'all') {
      const minRating = parseInt(academyRatingFilter);
      filtered = filtered.filter(academy => academy.rating >= minRating);
    }

    return filtered;
  };

  // Academy action handlers
  const handleViewAcademy = (academy) => {
    setSelectedAcademyForModal(academy);
    setIsAcademyModalOpen(true);
  };

  const handleEditAcademy = (academy) => {
    console.log('Editing academy:', academy);
    setSelectedAcademyForModal(academy);
    
    const formData = {
      name: academy.name || '',
      type: academy.type || 'sports',
      establishedYear: academy.establishedYear || '',
      rating: academy.rating || 0,
      description: academy.description || '',
      email: academy.email || '',
      phone: academy.phone || '',
      location: academy.location || '',
      website: academy.website || '',
      capacity: academy.capacity || 0,
      operatingHours: academy.operatingHours || '',
      facilities: academy.facilities ? academy.facilities.join(', ') : ''
    };
    
    console.log('Setting form data:', formData);
    setAcademyFormData(formData);
    setFormErrors({});
    setIsAddAcademyModalOpen(true);
  };

  const handleAddNewAcademy = () => {
    setSelectedAcademyForModal(null);
    setAcademyFormData({
      name: '',
      type: 'sports',
      establishedYear: '',
      rating: 0,
      description: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      capacity: 0,
      operatingHours: '',
      facilities: ''
    });
    setFormErrors({});
    setIsAddAcademyModalOpen(true);
  };

  const handleManagePrograms = (academy) => {
    setSelectedAcademyForPrograms(academy);
    setIsProgramsModalOpen(true);
  };

  const handleDeleteProgram = async (programId) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      try {
        await deleteProgram(projectId, selectedAcademyForPrograms.id, programId);
        await fetchAcademies(projectId);
      } catch (error) {
        console.error('Error deleting program:', error);
      }
    }
  };

  const handleViewProgram = (program) => {
    setSelectedProgramForView(program);
    setIsViewProgramModalOpen(true);
  };

  const handleEditProgram = (program) => {
    setSelectedProgramForEdit(program);
    
    // Convert old timeSlots format to new timeSlotsByDay format
    let timeSlotsByDay = {};
    if (program.timeSlots && Array.isArray(program.timeSlots)) {
      // If old format exists, convert it
      timeSlotsByDay = { 'Monday': program.timeSlots }; // Default to Monday for old data
    } else if (program.timeSlotsByDay) {
      timeSlotsByDay = program.timeSlotsByDay;
    }
    
    setProgramFormData({
      name: program.name || '',
      category: program.category || '',
      ageGroup: program.ageGroup || '',
      duration: program.duration || '',
      price: program.price || '',
      maxCapacity: program.maxCapacity || '',
      description: program.description || '',
      days: program.days || [],
      timeSlots: program.timeSlots || [], // Keep for backward compatibility
      timeSlotsByDay: timeSlotsByDay,
      coaches: Array.isArray(program.coaches) ? program.coaches.map(c => typeof c === 'object' ? c.name : c) : []
    });
    setFormErrors({});
    setIsEditProgramModalOpen(true);
  };

  const handleDeleteAcademy = async (academyId) => {
    if (window.confirm('Are you sure you want to delete this academy? This will also delete all associated programs.')) {
      try {
        await deleteAcademy(projectId, academyId);
        await fetchAcademies(projectId);
      } catch (error) {
        console.error('Error deleting academy:', error);
      }
    }
  };

  const handleAcademyFormChange = (field, value) => {
    setAcademyFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleProgramFormChange = (field, value) => {
    setProgramFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDaySelection = (day, isSelected) => {
    setProgramFormData(prev => {
      const newDays = isSelected 
        ? [...prev.days, day]
        : prev.days.filter(d => d !== day);
      
      const newTimeSlotsByDay = { ...prev.timeSlotsByDay };
      
      // If day is removed, also remove its time slots
      if (!isSelected) {
        delete newTimeSlotsByDay[day];
      } else if (!newTimeSlotsByDay[day]) {
        // If day is added, initialize with empty time slots array
        newTimeSlotsByDay[day] = [];
      }
      
      return {
        ...prev,
        days: newDays,
        timeSlotsByDay: newTimeSlotsByDay
      };
    });
  };

  const handleTimeSlotChange = (day, index, field, value) => {
    setProgramFormData(prev => {
      const newTimeSlotsByDay = { ...prev.timeSlotsByDay };
      if (!newTimeSlotsByDay[day]) {
        newTimeSlotsByDay[day] = [];
      }
      
      if (!newTimeSlotsByDay[day][index]) {
        newTimeSlotsByDay[day][index] = { startTime: '', endTime: '' };
      }
      
      newTimeSlotsByDay[day][index] = {
        ...newTimeSlotsByDay[day][index],
        [field]: value
      };
      
      return {
        ...prev,
        timeSlotsByDay: newTimeSlotsByDay
      };
    });
  };

  const addTimeSlot = (day) => {
    setProgramFormData(prev => {
      const newTimeSlotsByDay = { ...prev.timeSlotsByDay };
      if (!newTimeSlotsByDay[day]) {
        newTimeSlotsByDay[day] = [];
      }
      newTimeSlotsByDay[day].push({ startTime: '', endTime: '' });
      
      return {
        ...prev,
        timeSlotsByDay: newTimeSlotsByDay
      };
    });
  };

  const removeTimeSlot = (day, index) => {
    setProgramFormData(prev => {
      const newTimeSlotsByDay = { ...prev.timeSlotsByDay };
      newTimeSlotsByDay[day] = newTimeSlotsByDay[day].filter((_, i) => i !== index);
      
      return {
        ...prev,
        timeSlotsByDay: newTimeSlotsByDay
      };
    });
  };

  const validateAcademyForm = () => {
    const errors = {};
    if (!academyFormData.name.trim()) errors.name = 'Academy name is required';
    if (!academyFormData.email.trim()) errors.email = 'Email is required';
    if (!academyFormData.location.trim()) errors.location = 'Location is required';
    return errors;
  };

  const validateProgramForm = () => {
    const errors = {};
    if (!programFormData.name.trim()) errors.name = 'Program name is required';
    if (!programFormData.category) errors.category = 'Category is required';
    if (!programFormData.ageGroup) errors.ageGroup = 'Age group is required';
    if (!programFormData.duration) errors.duration = 'Duration is required';
    if (!programFormData.price) errors.price = 'Price is required';
    if (programFormData.days.length === 0) errors.days = 'At least one day is required';
    
    // Check if each selected day has at least one time slot
    const hasTimeSlots = programFormData.days.every(day => 
      programFormData.timeSlotsByDay[day] && 
      programFormData.timeSlotsByDay[day].length > 0
    );
    if (!hasTimeSlots) errors.timeSlots = 'Each selected day must have at least one time slot';
    
    return errors;
  };

  const handleAcademySubmit = async (e) => {
    e.preventDefault();
    const errors = validateAcademyForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const academyData = {
        ...academyFormData,
        facilities: academyFormData.facilities ? academyFormData.facilities.split(',').map(f => f.trim()).filter(f => f) : [],
        programs: selectedAcademyForModal?.programs || []
      };

      console.log('Submitting academy data:', academyData);
      console.log('Form data before submission:', academyFormData);
      console.log('Selected academy for modal:', selectedAcademyForModal);

      if (selectedAcademyForModal) {
        // Update existing academy
        console.log('Updating academy:', selectedAcademyForModal.id);
        await updateAcademy(projectId, academyData);
      } else {
        // Create new academy
        console.log('Creating new academy for project:', projectId);
        await addAcademy(projectId, academyData);
      }

      setIsAddAcademyModalOpen(false);
      setSelectedAcademyForModal(null);
      setAcademyFormData({
        name: '',
        type: 'sports',
        establishedYear: '',
        rating: 0,
        description: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        capacity: 0,
        operatingHours: '',
        facilities: ''
      });
      setFormErrors({});
      
      // Refresh academies
      await fetchAcademies(projectId);
    } catch (error) {
      console.error('Error saving academy:', error);
      setFormErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProgramSubmit = async (e) => {
    e.preventDefault();
    const errors = validateProgramForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert coaches from array of strings to array of objects for backward compatibility
      const coachesData = programFormData.coaches.map(name => ({ name, specialty: '' }));
      
      // Convert timeSlotsByDay to timeSlots array for backward compatibility
      const timeSlotsData = [];
      Object.keys(programFormData.timeSlotsByDay).forEach(day => {
        if (programFormData.timeSlotsByDay[day] && programFormData.timeSlotsByDay[day].length > 0) {
          programFormData.timeSlotsByDay[day].forEach(slot => {
            timeSlotsData.push({
              ...slot,
              day: day
            });
          });
        }
      });
      
      const programData = {
        ...programFormData,
        coaches: coachesData,
        timeSlots: timeSlotsData, // Include both formats for compatibility
        id: selectedProgramForEdit ? selectedProgramForEdit.id : Date.now().toString(),
        createdAt: selectedProgramForEdit ? selectedProgramForEdit.createdAt : new Date().toISOString()
      };

      if (selectedProgramForEdit) {
        // Update existing program
        await updateProgram(projectId, selectedAcademyForPrograms.id, selectedProgramForEdit.id, programData);
        setIsEditProgramModalOpen(false);
        setSelectedProgramForEdit(null);
      } else {
        // Create new program
        await addProgram(projectId, selectedAcademyForPrograms.id, programData);
      }
      
      setProgramFormData({
        name: '',
        category: '',
        ageGroup: '',
        duration: '',
        price: '',
        maxCapacity: '',
        description: '',
        days: [],
        timeSlots: [], // Keep for backward compatibility
        timeSlotsByDay: {},
        coaches: []
      });
      setFormErrors({});
      
      // Refresh academies to get updated programs
      await fetchAcademies(projectId);
    } catch (error) {
      console.error('Error saving program:', error);
      setFormErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>);
    }

    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Academies Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Academies</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage sports academies and training programs
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchAcademies(projectId)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={handleAddNewAcademy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            Add Academy
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search academies by name, description, or location..."
              value={academySearchTerm}
              onChange={(e) => setAcademySearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={academyTypeFilter}
            onChange={(e) => setAcademyTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="sports">Sports</option>
            <option value="fitness">Fitness</option>
            <option value="wellness">Wellness</option>
            <option value="martial-arts">Martial Arts</option>
            <option value="swimming">Swimming</option>
          </select>
          <select
            value={academyRatingFilter}
            onChange={(e) => setAcademyRatingFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {academiesLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading academies...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {academiesError && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading academies:</p>
            <p className="text-sm">{academiesError}</p>
          </div>
        </div>
      )}

      {/* Academies Table */}
      {!academiesLoading && !academiesError && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Programs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredAcademies().map((academy) => (
                  <tr key={academy.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <School className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {academy.name || 'Unknown Academy'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {academy.type || 'General'}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            Since {academy.establishedYear || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Mail className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="text-xs">{academy.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="text-xs">{academy.phone || 'No phone'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{academy.location || 'No location'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {renderStars(academy.rating || 0)}
                          <span className="ml-2 text-sm text-gray-900">{academy.rating || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{academy.capacity || 0} students</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {academy.programs && academy.programs.length > 0 ? (
                          academy.programs
                            .filter(program => program && typeof program === 'object' && program.name)
                            .slice(0, 3)
                            .map((program, index) => (
                              <span
                                key={index}
                                className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                              >
                                {program.name}
                              </span>
                            ))
                        ) : (
                          <span className="text-gray-500 text-xs">No programs</span>
                        )}
                        {academy.programs && academy.programs.length > 3 && (
                          <span className="text-xs text-gray-500">+{academy.programs.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewAcademy(academy)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditAcademy(academy)}
                          className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                          title="Edit Academy"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleManagePrograms(academy)}
                          className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                          title="Manage Programs"
                        >
                          <Award className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAcademy(academy.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Academy"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {getFilteredAcademies().length === 0 && (
            <div className="text-center py-12">
              <School className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No academies found</h3>
              <p className="text-gray-600">
                {projectAcademies && projectAcademies.length > 0
                  ? 'No academies match your search criteria.'
                  : 'Get started by adding your first academy.'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Academy Details Modal */}
      {isAcademyModalOpen && selectedAcademyForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Academy Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedAcademyForModal.type || 'Academy'} Information
                </p>
              </div>
              <button
                onClick={() => setIsAcademyModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Information Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <School className="h-5 w-5 mr-2 text-green-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Academy Name</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.name || 'Unknown Academy'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.type || 'General'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Established</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.establishedYear || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rating</label>
                    <div className="flex items-center mt-1">
                      {renderStars(selectedAcademyForModal.rating || 0)}
                      <span className="ml-2 text-sm text-gray-900">{selectedAcademyForModal.rating || 0}/5</span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedAcademyForModal.description || 'No description available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.email || 'No email'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.phone || 'No phone'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.location || 'No location'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Website</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.website || 'No website'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Capacity & Operating Hours Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Academy Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Capacity</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.capacity || 0} students
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Operating Hours</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.operatingHours || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Programs Section */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-blue-600" />
                    Programs Offered
                  </h3>
                  <button
                    onClick={() => {
                      setIsAcademyModalOpen(false);
                      setSelectedAcademyForPrograms(selectedAcademyForModal);
                      setIsProgramsModalOpen(true);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Manage Programs
                  </button>
                </div>
                
                {selectedAcademyForModal.programs && selectedAcademyForModal.programs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedAcademyForModal.programs
                      .filter(program => program && typeof program === 'object' && program.name)
                      .map((program, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-300 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 text-sm">{program.name}</h4>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setIsAcademyModalOpen(false);
                                  setSelectedAcademyForPrograms(selectedAcademyForModal);
                                  handleViewProgram(program);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                              <button
                                                                 onClick={() => {
                                   setIsAcademyModalOpen(false);
                                   setSelectedAcademyForPrograms(selectedAcademyForModal);
                                   handleEditProgram(program);
                                 }}
                                 className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                                 title="Edit Program"
                               >
                                 <Edit className="h-3 w-3" />
                               </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete "${program.name}"?`)) {
                                    handleDeleteProgram(program.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Delete Program"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Category:</span>
                              <span className="capitalize">{program.category || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Age Group:</span>
                              <span className="capitalize">{program.ageGroup || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Duration:</span>
                              <span>{program.duration || 'N/A'} months</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Price:</span>
                              <span>${program.price || 'N/A'}/month</span>
                            </div>
                            {program.maxCapacity && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Capacity:</span>
                                <span>{program.maxCapacity} students</span>
                              </div>
                            )}
                          </div>
                          
                                                        {/* Quick Info Tags */}
                              <div className="mt-3 pt-2 border-t border-gray-100">
                                <div className="flex flex-wrap gap-1">
                                  {program.days && program.days.length > 0 && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                      {program.days.length} day{program.days.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {program.timeSlots && program.timeSlots.length > 0 && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                      {program.timeSlots.length} time slot{program.timeSlots.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {program.coaches && program.coaches.length > 0 && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                      {program.coaches.length} coach{program.coaches.length > 1 ? 'es' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-3">No programs listed yet</p>
                    <button
                      onClick={() => {
                        setIsAcademyModalOpen(false);
                        setSelectedAcademyForPrograms(selectedAcademyForModal);
                        setIsProgramsModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Your First Program
                    </button>
                  </div>
                )}
              </div>

              {/* Facilities Section */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Facilities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAcademyForModal.facilities && selectedAcademyForModal.facilities.length > 0 ? (
                    selectedAcademyForModal.facilities.map((facility, index) => (
                                             <span
                         key={index}
                         className="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full"
                       >
                         {facility}
                       </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No facilities listed</span>
                  )}
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Academy ID</label>
                    <p className="text-sm text-gray-900 font-mono mt-1">
                      {selectedAcademyForModal.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created At</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.createdAt ? new Date(selectedAcademyForModal.createdAt.toDate()).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-100">
              <button
                onClick={() => handleEditAcademy(selectedAcademyForModal)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Academy
              </button>
              <button
                onClick={() => setIsAcademyModalOpen(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Academy Modal */}
      {isAddAcademyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedAcademyForModal ? 'Edit Academy' : 'Add New Academy'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedAcademyForModal ? 'Update academy information' : 'Create a new sports academy'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddAcademyModalOpen(false);
                  setSelectedAcademyForModal(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <form id="academyForm" onSubmit={handleAcademySubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academy Name *
                    </label>
                    <input
                      type="text"
                      value={academyFormData.name}
                      onChange={(e) => handleAcademyFormChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter academy name"
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={academyFormData.type}
                      onChange={(e) => handleAcademyFormChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="sports">Sports</option>
                      <option value="fitness">Fitness</option>
                      <option value="wellness">Wellness</option>
                      <option value="martial-arts">Martial Arts</option>
                      <option value="swimming">Swimming</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Established Year
                    </label>
                    <input
                      type="number"
                      value={academyFormData.establishedYear}
                      onChange={(e) => handleAcademyFormChange('establishedYear', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2020"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={academyFormData.rating}
                      onChange={(e) => handleAcademyFormChange('rating', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.0 - 5.0"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={academyFormData.description}
                    onChange={(e) => handleAcademyFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the academy and its mission..."
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={academyFormData.email}
                      onChange={(e) => handleAcademyFormChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="academy@example.com"
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={academyFormData.phone}
                      onChange={(e) => handleAcademyFormChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={academyFormData.location}
                      onChange={(e) => handleAcademyFormChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter location or address"
                    />
                    {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={academyFormData.website}
                      onChange={(e) => handleAcademyFormChange('website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://academy.com"
                    />
                  </div>
                </div>

                {/* Business Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity
                    </label>
                    <input
                      type="number"
                      value={academyFormData.capacity}
                      onChange={(e) => handleAcademyFormChange('capacity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Number of students"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      value={academyFormData.operatingHours}
                      onChange={(e) => handleAcademyFormChange('operatingHours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Mon-Fri 8AM-8PM"
                    />
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facilities (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={academyFormData.facilities}
                    onChange={(e) => handleAcademyFormChange('facilities', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Indoor Court, Swimming Pool, Gym, Locker Rooms"
                  />
                </div>

                {/* Submit Error Display */}
                {formErrors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{formErrors.submit}</p>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-100 space-x-3">
              <button
                onClick={() => {
                  setIsAddAcademyModalOpen(false);
                  setSelectedAcademyForModal(null);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
                              <button
                  type="submit"
                  form="academyForm"
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {selectedAcademyForModal ? 'Update Academy' : 'Create Academy'}
                  {isSubmitting && (
                    <svg className="animate-spin h-4 w-4 ml-2 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Programs Management Modal */}
      {isProgramsModalOpen && selectedAcademyForPrograms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Manage Programs - {selectedAcademyForPrograms.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add, edit, and manage programs for this academy
                </p>
              </div>
              <button
                onClick={() => {
                  setIsProgramsModalOpen(false);
                  setSelectedAcademyForPrograms(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Add New Program Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Program</h3>
                <form onSubmit={handleProgramSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Program Name *
                      </label>
                      <input
                        type="text"
                        value={programFormData.name}
                        onChange={(e) => handleProgramFormChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Football Training"
                      />
                      {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select 
                        value={programFormData.category}
                        onChange={(e) => handleProgramFormChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Category</option>
                        <option value="team-sports">Team Sports</option>
                        <option value="individual-sports">Individual Sports</option>
                        <option value="fitness">Fitness</option>
                        <option value="wellness">Wellness</option>
                        <option value="martial-arts">Martial Arts</option>
                        <option value="aquatics">Aquatics</option>
                      </select>
                      {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age Group *
                      </label>
                      <select 
                        value={programFormData.ageGroup}
                        onChange={(e) => handleProgramFormChange('ageGroup', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Age Group</option>
                        <option value="kids">Kids (3-12)</option>
                        <option value="teens">Teens (13-17)</option>
                        <option value="adults">Adults (18+)</option>
                        <option value="seniors">Seniors (50+)</option>
                        <option value="all-ages">All Ages</option>
                      </select>
                      {formErrors.ageGroup && <p className="text-red-500 text-xs mt-1">{formErrors.ageGroup}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (months) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={programFormData.duration}
                        onChange={(e) => handleProgramFormChange('duration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 3"
                      />
                      {formErrors.duration && <p className="text-red-500 text-xs mt-1">{formErrors.duration}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (per month) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={programFormData.price}
                        onChange={(e) => handleProgramFormChange('price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 150.00"
                      />
                      {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={programFormData.maxCapacity}
                        onChange={(e) => handleProgramFormChange('maxCapacity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={programFormData.description}
                      onChange={(e) => handleProgramFormChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the program, what students will learn, requirements..."
                    />
                  </div>

                  {/* Program Schedule - Days with Times */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program Schedule - Days with Times *
                    </label>
                    <div className="space-y-4">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <div key={day} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={programFormData.days.includes(day)}
                                onChange={(e) => handleDaySelection(day, e.target.checked)}
                                className="mr-3 text-blue-600 focus:ring-blue-500 h-4 w-4"
                              />
                              <span className="font-medium text-gray-900">{day}</span>
                            </label>
                            {programFormData.days.includes(day) && (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          
                          {/* Time Slots for this day */}
                          {programFormData.days.includes(day) && (
                            <div className="ml-6 space-y-3">
                              <div className="text-sm text-gray-600 mb-2">
                                Time slots for {day}:
                              </div>
                              
                              {programFormData.timeSlotsByDay[day] && programFormData.timeSlotsByDay[day].map((slot, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="time"
                                      value={slot.startTime}
                                      onChange={(e) => handleTimeSlotChange(day, index, 'startTime', e.target.value)}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <span className="text-gray-500 text-sm">to</span>
                                    <input
                                      type="time"
                                      value={slot.endTime}
                                      onChange={(e) => handleTimeSlotChange(day, index, 'endTime', e.target.value)}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => removeTimeSlot(day, index)}
                                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Remove time slot"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                              
                              <button
                                type="button"
                                onClick={() => addTimeSlot(day)}
                                className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Time for {day}
                              </button>
                            </div>
                          )}
                          
                          {!programFormData.days.includes(day) && (
                            <div className="ml-6 text-sm text-gray-500 italic">
                              Check the box above to add time slots for {day}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coaches */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coaches
                    </label>
                    <div className="space-y-2">
                      {programFormData.coaches.map((coach, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={coach.name}
                            onChange={(e) => {
                              const newCoaches = [...programFormData.coaches];
                              newCoaches[index] = { ...coach, name: e.target.value };
                              handleProgramFormChange('coaches', newCoaches);
                            }}
                            placeholder="Coach name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={coach.specialty}
                            onChange={(e) => {
                              const newCoaches = [...programFormData.coaches];
                              newCoaches[index] = { ...coach, specialty: e.target.value };
                              handleProgramFormChange('coaches', newCoaches);
                            }}
                            placeholder="Specialty"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newCoaches = programFormData.coaches.filter((_, i) => i !== index);
                              handleProgramFormChange('coaches', newCoaches);
                            }}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newCoaches = [...programFormData.coaches, { name: '', specialty: '' }];
                          handleProgramFormChange('coaches', newCoaches);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        + Add Coach
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4 mr-2 inline" />
                      {isSubmitting ? 'Adding...' : 'Add Program'}
                    </button>
                  </div>

                  {/* Submit Error Display */}
                  {formErrors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                      <p className="text-red-600 text-sm">{formErrors.submit}</p>
                    </div>
                  )}
                </form>
              </div>

              {/* Existing Programs Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Programs</h3>
                
                {selectedAcademyForPrograms.programs && selectedAcademyForPrograms.programs.length > 0 ? (
                  <div className="space-y-3">
                    {console.log('Rendering programs:', selectedAcademyForPrograms.programs)}
                    {selectedAcademyForPrograms.programs
                      .filter(program => program && typeof program === 'object' && program.name)
                      .map((program, index) => {
                        console.log('Rendering program:', program);
                        return (
                          <div key={program.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">{program.name}</h4>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                {program.category}
                              </span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                {program.ageGroup}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">
                              {program.description || 'No description available'}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Duration: {program.duration} months</span>
                              <span>Price: ${program.price}/month</span>
                              {program.maxCapacity && <span>Capacity: {program.maxCapacity}</span>}
                            </div>
                            
                            {/* Time Slots */}
                            {program.timeSlots && program.timeSlots.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500 font-medium">Time Slots: </span>
                                {program.timeSlots.map((slot, idx) => (
                                  <span key={idx} className="text-xs text-gray-600 mr-2">
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* Days */}
                            {program.days && program.days.length > 0 && (
                              <div className="mt-1">
                                <span className="text-xs text-gray-500 font-medium">Days: </span>
                                <span className="text-xs text-gray-600">
                                  {program.days.join(', ')}
                                </span>
                              </div>
                            )}
                            
                            {/* Coaches */}
                            {program.coaches && program.coaches.length > 0 && (
                              <div className="mt-1">
                                <span className="text-xs text-gray-500 font-medium">Coaches: </span>
                                <span className="text-xs text-gray-600">
                                  {program.coaches.map(coach => coach.name).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleViewProgram(program)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="View Program"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditProgram(program)}
                              className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                              title="Edit Program"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProgram(program.id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete Program"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No programs yet</p>
                    <p className="text-sm">Add your first program using the form above</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsProgramsModalOpen(false);
                  setSelectedAcademyForPrograms(null);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Program Modal */}
      {isViewProgramModalOpen && selectedProgramForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Program Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedProgramForView.name} - {selectedProgramForView.category}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsViewProgramModalOpen(false);
                  setSelectedProgramForView(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Program Name</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedProgramForView.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedProgramForView.category}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Age Group</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedProgramForView.ageGroup}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedProgramForView.duration} months</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Price</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">${selectedProgramForView.price}/month</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Max Capacity</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedProgramForView.maxCapacity || 'Unlimited'}</p>
                  </div>
                </div>
                {selectedProgramForView.description && (
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedProgramForView.description}</p>
                  </div>
                )}
              </div>

              {/* Time Slots */}
              {selectedProgramForView.timeSlots && selectedProgramForView.timeSlots.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Slots</h3>
                  <div className="space-y-2">
                    {selectedProgramForView.timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-blue-900">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Days */}
              {selectedProgramForView.days && selectedProgramForView.days.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Days</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProgramForView.days.map((day, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaches */}
              {selectedProgramForView.coaches && selectedProgramForView.coaches.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Coaches</h3>
                  <div className="space-y-2">
                    {selectedProgramForView.coaches.map((coach, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <span className="font-medium text-purple-900">{coach.name}</span>
                        {coach.specialty && (
                          <span className="text-purple-700">- {coach.specialty}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-100 space-x-3">
              <button
                onClick={() => handleEditProgram(selectedProgramForView)}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Program
              </button>
              <button
                onClick={() => {
                  setIsViewProgramModalOpen(false);
                  setSelectedProgramForView(null);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {isEditProgramModalOpen && selectedProgramForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Program</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Update program: {selectedProgramForEdit.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditProgramModalOpen(false);
                  setSelectedProgramForEdit(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Same form as Add Program */}
            <div className="p-6">
              {/* Add New Program Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Program</h3>
                <form onSubmit={handleProgramSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Program Name *
                      </label>
                      <input
                        type="text"
                        value={programFormData.name}
                        onChange={(e) => handleProgramFormChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Football Training"
                      />
                      {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select 
                        value={programFormData.category}
                        onChange={(e) => handleProgramFormChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Category</option>
                        <option value="team-sports">Team Sports</option>
                        <option value="individual-sports">Individual Sports</option>
                        <option value="fitness">Fitness</option>
                        <option value="wellness">Wellness</option>
                        <option value="martial-arts">Martial Arts</option>
                        <option value="aquatics">Aquatics</option>
                      </select>
                      {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age Group *
                      </label>
                      <select 
                        value={programFormData.ageGroup}
                        onChange={(e) => handleProgramFormChange('ageGroup', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Age Group</option>
                        <option value="kids">Kids (3-12)</option>
                        <option value="teens">Teens (13-17)</option>
                        <option value="adults">Adults (18+)</option>
                        <option value="seniors">Seniors (50+)</option>
                        <option value="all-ages">All Ages</option>
                      </select>
                      {formErrors.ageGroup && <p className="text-red-500 text-xs mt-1">{formErrors.ageGroup}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (months) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={programFormData.duration}
                        onChange={(e) => handleProgramFormChange('duration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 3"
                      />
                      {formErrors.duration && <p className="text-red-500 text-xs mt-1">{formErrors.duration}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (per month) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={programFormData.price}
                        onChange={(e) => handleProgramFormChange('price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 150.00"
                      />
                      {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={programFormData.maxCapacity}
                        onChange={(e) => handleProgramFormChange('maxCapacity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={programFormData.description}
                      onChange={(e) => handleProgramFormChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the program, what students will learn, requirements..."
                    />
                  </div>

                  {/* Program Schedule - Days with Times */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program Schedule - Days with Times *
                    </label>
                    <div className="space-y-4">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <div key={day} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={programFormData.days.includes(day)}
                                onChange={(e) => handleDaySelection(day, e.target.checked)}
                                className="mr-3 text-blue-600 focus:ring-blue-500 h-4 w-4"
                              />
                              <span className="font-medium text-gray-900">{day}</span>
                            </label>
                            {programFormData.days.includes(day) && (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          
                          {/* Time Slots for this day */}
                          {programFormData.days.includes(day) && (
                            <div className="ml-6 space-y-3">
                              <div className="text-sm text-gray-600 mb-2">
                                Time slots for {day}:
                              </div>
                              
                              {programFormData.timeSlotsByDay[day] && programFormData.timeSlotsByDay[day].map((slot, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="time"
                                      value={slot.startTime}
                                      onChange={(e) => handleTimeSlotChange(day, index, 'startTime', e.target.value)}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <span className="text-gray-500 text-sm">to</span>
                                    <input
                                      type="time"
                                      value={slot.endTime}
                                      onChange={(e) => handleTimeSlotChange(day, index, 'endTime', e.target.value)}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => removeTimeSlot(day, index)}
                                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Remove time slot"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                              
                              <button
                                type="button"
                                onClick={() => addTimeSlot(day)}
                                className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Time for {day}
                              </button>
                            </div>
                          )}
                          
                          {!programFormData.days.includes(day) && (
                            <div className="ml-6 text-sm text-gray-500 italic">
                              Check the box above to add time slots for {day}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coaches */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coaches
                    </label>
                    <div className="space-y-2">
                      {programFormData.coaches.map((coach, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={coach.name}
                            onChange={(e) => {
                              const newCoaches = [...programFormData.coaches];
                              newCoaches[index] = { ...coach, name: e.target.value };
                              handleProgramFormChange('coaches', newCoaches);
                            }}
                            placeholder="Coach name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={coach.specialty}
                            onChange={(e) => {
                              const newCoaches = [...programFormData.coaches];
                              newCoaches[index] = { ...coach, specialty: e.target.value };
                              handleProgramFormChange('coaches', newCoaches);
                            }}
                            placeholder="Specialty"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newCoaches = programFormData.coaches.filter((_, i) => i !== index);
                              handleProgramFormChange('coaches', newCoaches);
                            }}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newCoaches = [...programFormData.coaches, { name: '', specialty: '' }];
                          handleProgramFormChange('coaches', newCoaches);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        + Add Coach
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Edit className="h-4 w-4 mr-2 inline" />
                      {isSubmitting ? 'Updating...' : 'Update Program'}
                    </button>
                  </div>

                  {/* Submit Error Display */}
                  {formErrors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                      <p className="text-red-600 text-sm">{formErrors.submit}</p>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsEditProgramModalOpen(false);
                  setSelectedProgramForEdit(null);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademiesManagement;
