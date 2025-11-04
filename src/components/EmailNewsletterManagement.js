import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Users,
  Send,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Download,
  X,
  Smartphone,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import {
  getEmailGroups,
  createEmailGroup,
  updateEmailGroup,
  deleteEmailGroup,
  getCampaigns,
  createCampaign,
  sendCampaign,
  getProjectUsersEmails,
  searchProjectUsers,
  deleteCampaign
} from '../services/emailNewsletterService';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as XLSX from 'xlsx';

const EmailNewsletterManagement = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState('campaigns'); // campaigns, groups
  const [groups, setGroups] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [previewCampaign, setPreviewCampaign] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // Group form data
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    emails: []
  });
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [customEmailSearchTerm, setCustomEmailSearchTerm] = useState('');
  const [customEmailSearchResults, setCustomEmailSearchResults] = useState([]);
  const [searchingCustomUsers, setSearchingCustomUsers] = useState(false);
  const [showCustomEmailSearch, setShowCustomEmailSearch] = useState(false);

  // Campaign form data
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    content: '',
    recipientType: 'all', // all, group, custom
    selectedGroups: [],
    customEmails: [],
    headerImage: ''
  });

  // Load data
  const loadGroups = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await getEmailGroups(projectId);
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  }, [projectId]);

  const loadCampaigns = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await getCampaigns(projectId);
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadProjectUsers = useCallback(async () => {
    if (!projectId) return;
    try {
      const users = await getProjectUsersEmails(projectId);
      setProjectUsers(users);
    } catch (error) {
      console.error('Error loading project users:', error);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadGroups();
      loadCampaigns();
      loadProjectUsers();
    }
  }, [projectId, loadGroups, loadCampaigns, loadProjectUsers]);

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await updateEmailGroup(projectId, editingGroup.id, groupForm);
      } else {
        await createEmailGroup(projectId, groupForm);
      }
      loadGroups();
      resetGroupForm();
      setShowGroupModal(false);
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Failed to save group. Please try again.');
    }
  };

  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCampaign) {
        const campaignRef = doc(db, `projects/${projectId}/emailCampaigns`, editingCampaign.id);
        await updateDoc(campaignRef, {
          ...campaignForm,
          updatedAt: serverTimestamp()
        });
      } else {
        await createCampaign(projectId, campaignForm);
      }
      loadCampaigns();
      resetCampaignForm();
      setShowCampaignModal(false);
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign. Please try again.');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await deleteEmailGroup(projectId, groupId);
        loadGroups();
      } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group.');
      }
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign(projectId, campaignId);
        loadCampaigns();
      } catch (error) {
        console.error('Error deleting campaign:', error);
        alert('Failed to delete campaign.');
      }
    }
  };

  const handleSendCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to send this campaign? This action cannot be undone.')) {
      try {
        await sendCampaign(projectId, campaignId);
        alert('Campaign is being sent! Please check back in a few moments.');
        loadCampaigns();
      } catch (error) {
        console.error('Error sending campaign:', error);
        alert('Failed to send campaign.');
      }
    }
  };

  const resetGroupForm = () => {
    setEditingGroup(null);
    setGroupForm({
      name: '',
      description: '',
      emails: []
    });
  };

  const resetCampaignForm = () => {
    setEditingCampaign(null);
    setCampaignForm({
      subject: '',
      content: '',
      recipientType: 'all',
      selectedGroups: [],
      customEmails: [],
      headerImage: ''
    });
  };

  const addEmailToGroup = (email) => {
    if (email && !groupForm.emails.includes(email)) {
      setGroupForm(prev => ({
        ...prev,
        emails: [...prev.emails, email]
      }));
    }
  };

  const removeEmailFromGroup = (email) => {
    setGroupForm(prev => ({
      ...prev,
      emails: prev.emails.filter(e => e !== email)
    }));
  };

  const addEmailToCampaign = (email) => {
    if (email && !campaignForm.customEmails.includes(email)) {
      setCampaignForm(prev => ({
        ...prev,
        customEmails: [...prev.customEmails, email]
      }));
    }
  };

  const removeEmailFromCampaign = (email) => {
    setCampaignForm(prev => ({
      ...prev,
      customEmails: prev.customEmails.filter(e => e !== email)
    }));
  };

  const handleUserSearch = async (term) => {
    setUserSearchTerm(term);
    if (!term || term.length < 2) {
      setSearchResults([]);
      setShowUserSearch(false);
      return;
    }
    
    try {
      setSearchingUsers(true);
      setShowUserSearch(true);
      const results = await searchProjectUsers(projectId, term);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleCustomEmailSearch = async (term) => {
    setCustomEmailSearchTerm(term);
    if (!term || term.length < 2) {
      setCustomEmailSearchResults([]);
      setShowCustomEmailSearch(false);
      return;
    }
    
    try {
      setSearchingCustomUsers(true);
      setShowCustomEmailSearch(true);
      const results = await searchProjectUsers(projectId, term);
      setCustomEmailSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingCustomUsers(false);
    }
  };

  const addUserToGroup = (user) => {
    addEmailToGroup(user.email);
    setUserSearchTerm('');
    setSearchResults([]);
    setShowUserSearch(false);
  };

  const addUserToCampaign = (user) => {
    addEmailToCampaign(user.email);
    setCustomEmailSearchTerm('');
    setCustomEmailSearchResults([]);
    setShowCustomEmailSearch(false);
  };

  const openEditGroup = (group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || '',
      emails: group.emails
    });
    setShowGroupModal(true);
  };

  const openEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      subject: campaign.subject,
      content: campaign.content,
      recipientType: campaign.recipientType,
      selectedGroups: campaign.selectedGroups || [],
      customEmails: campaign.customEmails || [],
      headerImage: campaign.headerImage || ''
    });
    setShowCampaignModal(true);
  };

  // Export campaigns to Excel
  const exportToExcel = () => {
    try {
      let dataToExport = campaigns;
      
      if (exportStartDate || exportEndDate) {
        dataToExport = campaigns.filter(campaign => {
          const campaignDate = campaign.createdAt?.toDate ? campaign.createdAt.toDate() : new Date(campaign.createdAt);
          
          if (exportStartDate && exportEndDate) {
            const start = new Date(exportStartDate);
            const end = new Date(exportEndDate);
            end.setHours(23, 59, 59, 999);
            return campaignDate >= start && campaignDate <= end;
          } else if (exportStartDate) {
            const start = new Date(exportStartDate);
            return campaignDate >= start;
          } else if (exportEndDate) {
            const end = new Date(exportEndDate);
            end.setHours(23, 59, 59, 999);
            return campaignDate <= end;
          }
          return true;
        });
      }

      const exportData = dataToExport.map(campaign => ({
        'ID': campaign.id,
        'Subject': campaign.subject || 'N/A',
        'Recipient Type': campaign.recipientType || 'N/A',
        'Recipient Count': campaign.recipientCount || 0,
        'Sent Count': campaign.sentCount || 0,
        'Failed Count': campaign.failedCount || 0,
        'Status': campaign.status || 'N/A',
        'Created At': campaign.createdAt?.toDate ? campaign.createdAt.toDate().toLocaleString() : 'N/A',
        'Sent At': campaign.sentAt?.toDate ? campaign.sentAt.toDate().toLocaleString() : 'N/A'
      }));

      if (exportData.length === 0) {
        alert('No data to export for the selected date range.');
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 25 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, 
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Email Campaigns');

      const dateRange = exportStartDate && exportEndDate 
        ? `${exportStartDate}_to_${exportEndDate}`
        : exportStartDate 
        ? `from_${exportStartDate}`
        : exportEndDate 
        ? `to_${exportEndDate}`
        : new Date().toISOString().split('T')[0];
      const fileName = `Email_Campaigns_${dateRange}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setShowExportModal(false);
      setExportStartDate('');
      setExportEndDate('');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'sending': return <Send className="w-4 h-4 animate-pulse" />;
      case 'sent': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    totalCampaigns: campaigns.length,
    sentCampaigns: campaigns.filter(c => c.status === 'sent').length,
    totalGroups: groups.length,
    totalRecipients: projectUsers.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pre-red mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading email campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Header Section */}
      <div className="bg-gradient-to-r from-red-50 via-white to-red-50 rounded-3xl shadow-lg border-2 border-red-100 p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Email Newsletter</h2>
              <p className="text-gray-600 mt-1">Send branded email campaigns to project members</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {activeTab === 'campaigns' && (
              <>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="inline-flex items-center px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-medium"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export Excel
                </button>
                <button
                  onClick={() => {
                    resetCampaignForm();
                    setShowCampaignModal(true);
                  }}
                  className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-medium"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Campaign
                </button>
              </>
            )}
            {activeTab === 'groups' && (
              <button
                onClick={() => {
                  resetGroupForm();
                  setShowGroupModal(true);
                }}
                className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Group
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-base font-medium text-gray-600 mb-3">Total Campaigns</p>
              <p className="text-4xl font-bold text-gray-900">{stats.totalCampaigns}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-md">
              <Mail className="h-10 w-10 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-base font-medium text-gray-600 mb-3">Sent Successfully</p>
              <p className="text-4xl font-bold text-gray-900">{stats.sentCampaigns}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 shadow-md">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-base font-medium text-gray-600 mb-3">Email Groups</p>
              <p className="text-4xl font-bold text-gray-900">{stats.totalGroups}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 shadow-md">
              <Users className="h-10 w-10 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-base font-medium text-gray-600 mb-3">Total Recipients</p>
              <p className="text-4xl font-bold text-gray-900">{stats.totalRecipients}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 shadow-md">
              <Smartphone className="h-10 w-10 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
        <nav className="flex space-x-2">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`${
              activeTab === 'campaigns'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            } flex-1 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center transition-all duration-200`}
          >
            <Mail className="w-5 h-5 mr-2" />
            Campaigns
            {campaigns.length > 0 && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'campaigns' ? 'bg-white/20' : 'bg-red-100 text-red-700'
              }`}>
                {campaigns.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`${
              activeTab === 'groups'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            } flex-1 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center transition-all duration-200`}
          >
            <Users className="w-5 h-5 mr-2" />
            Groups
            {groups.length > 0 && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'groups' ? 'bg-white/20' : 'bg-red-100 text-red-700'
              }`}>
                {groups.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {filteredCampaigns.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-16 text-center">
              <div className="p-6 bg-gray-50 rounded-2xl inline-block mb-4">
                <Mail className="w-16 h-16 text-gray-400 mx-auto" />
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">No campaigns yet</p>
              <p className="text-gray-500 mb-6">Create your first email campaign to get started</p>
              <button
                onClick={() => {
                  resetCampaignForm();
                  setShowCampaignModal(true);
                }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                          <Mail className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{campaign.subject}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                              {getStatusIcon(campaign.status)}
                              <span className="ml-1.5">{campaign.status || 'draft'}</span>
                            </span>
                            <span className="text-xs text-gray-500">
                              {campaign.recipientType === 'all' && 'All Users'}
                              {campaign.recipientType === 'group' && `${campaign.selectedGroups?.length || 0} Groups`}
                              {campaign.recipientType === 'custom' && `${campaign.customEmails?.length || 0} Recipients`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Recipients</p>
                          <p className="text-sm font-semibold text-gray-900">{campaign.recipientCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Sent</p>
                          <p className="text-sm font-semibold text-green-600">{campaign.sentCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Failed</p>
                          <p className="text-sm font-semibold text-red-600">{campaign.failedCount || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => {
                          setPreviewCampaign(campaign);
                          setShowPreviewModal(true);
                        }}
                        className="flex-1 lg:flex-none px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 lg:mr-0 mr-2" />
                        <span className="lg:hidden">Preview</span>
                      </button>
                      {campaign.status === 'draft' && (
                        <>
                          <button
                            onClick={() => openEditCampaign(campaign)}
                            className="flex-1 lg:flex-none px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm flex items-center justify-center"
                          >
                            <Edit className="w-4 h-4 lg:mr-0 mr-2" />
                            <span className="lg:hidden">Edit</span>
                          </button>
                          <button
                            onClick={() => handleSendCampaign(campaign.id)}
                            className="flex-1 lg:flex-none px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm flex items-center justify-center"
                          >
                            <Send className="w-4 h-4 lg:mr-0 mr-2" />
                            <span className="lg:hidden">Send</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="flex-1 lg:flex-none px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 lg:mr-0 mr-2" />
                        <span className="lg:hidden">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-16 text-center">
              <div className="p-6 bg-gray-50 rounded-2xl inline-block mb-4">
                <Users className="w-16 h-16 text-gray-400 mx-auto" />
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">No groups yet</p>
              <p className="text-gray-500 mb-6">Create email groups to organize your recipients</p>
              <button
                onClick={() => {
                  resetGroupForm();
                  setShowGroupModal(true);
                }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-50 rounded-xl">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditGroup(group)}
                        className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-gray-600 mb-4">{group.description}</p>
                  )}
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Recipients</span>
                      <span className="text-lg font-bold text-gray-900">{group.emails?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingGroup ? 'Edit Email Group' : 'Create Email Group'}
                </h3>
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    resetGroupForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleGroupSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="e.g., Building A Residents"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Optional description for this group"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Recipients
                </label>
                
                {/* User Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="Search users by name, email, or unit (min 2 characters)"
                  />
                  
                  {/* Search Results Dropdown */}
                  {showUserSearch && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {searchingUsers ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addUserToGroup(user)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{user.fullName}</div>
                            <div className="text-sm text-gray-500">{user.email} • Unit: {user.unit || 'N/A'}</div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">No users found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Added Emails List */}
                {groupForm.emails.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {groupForm.emails.map((email, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => removeEmailFromGroup(email)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="mt-2 text-sm text-gray-500">
                  {groupForm.emails.length} recipient(s) added
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowGroupModal(false);
                    resetGroupForm();
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl font-medium transition-all"
                >
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingCampaign ? 'Edit Campaign' : 'Create Email Campaign'}
                </h3>
                <button
                  onClick={() => {
                    setShowCampaignModal(false);
                    resetCampaignForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCampaignSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject *
                </label>
                <input
                  type="text"
                  required
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Content *
                </label>
                <textarea
                  required
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                  rows="8"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all font-mono text-sm"
                  placeholder="Enter email content (HTML supported)"
                />
                <p className="mt-2 text-sm text-gray-500">HTML tags are supported for formatting</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Header Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={campaignForm.headerImage}
                  onChange={(e) => setCampaignForm({ ...campaignForm, headerImage: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients *
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="recipientType"
                      value="all"
                      checked={campaignForm.recipientType === 'all'}
                      onChange={(e) => setCampaignForm({ ...campaignForm, recipientType: e.target.value })}
                      className="h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-3 font-medium text-gray-700">All Project Users ({projectUsers.length})</span>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="recipientType"
                      value="group"
                      checked={campaignForm.recipientType === 'group'}
                      onChange={(e) => setCampaignForm({ ...campaignForm, recipientType: e.target.value })}
                      className="h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-3 font-medium text-gray-700">Specific Groups</span>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="recipientType"
                      value="custom"
                      checked={campaignForm.recipientType === 'custom'}
                      onChange={(e) => setCampaignForm({ ...campaignForm, recipientType: e.target.value })}
                      className="h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-3 font-medium text-gray-700">Custom Recipients</span>
                  </label>
                </div>
              </div>

              {campaignForm.recipientType === 'group' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Groups
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 rounded-xl p-4">
                    {groups.map((group) => (
                      <label key={group.id} className="flex items-center p-3 hover:bg-white rounded-lg cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={campaignForm.selectedGroups.includes(group.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCampaignForm({
                                ...campaignForm,
                                selectedGroups: [...campaignForm.selectedGroups, group.id]
                              });
                            } else {
                              setCampaignForm({
                                ...campaignForm,
                                selectedGroups: campaignForm.selectedGroups.filter(id => id !== group.id)
                              });
                            }
                          }}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 rounded"
                        />
                        <span className="ml-3 text-gray-700">{group.name} ({group.emails?.length || 0} recipients)</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {campaignForm.recipientType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Custom Recipients
                  </label>
                  
                  {/* Custom User Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={customEmailSearchTerm}
                      onChange={(e) => handleCustomEmailSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="Search users by name, email, or unit (min 2 characters)"
                    />
                    
                    {/* Search Results Dropdown */}
                    {showCustomEmailSearch && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {searchingCustomUsers ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
                          </div>
                        ) : customEmailSearchResults.length > 0 ? (
                          customEmailSearchResults.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => addUserToCampaign(user)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{user.fullName}</div>
                              <div className="text-sm text-gray-500">{user.email} • Unit: {user.unit || 'N/A'}</div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">No users found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Added Custom Emails List */}
                  {campaignForm.customEmails.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {campaignForm.customEmails.map((email, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removeEmailFromCampaign(email)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="mt-2 text-sm text-gray-500">
                    {campaignForm.customEmails.length} recipient(s) added
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCampaignModal(false);
                    resetCampaignForm();
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl font-medium transition-all"
                >
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Campaign Modal */}
      {showPreviewModal && previewCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Email Preview</h3>
                  <p className="text-sm text-gray-500 mt-1">Preview how your email will look to recipients</p>
                </div>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewCampaign(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Email Header */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="text-sm text-gray-500 mb-2">Subject:</div>
                <div className="text-xl font-bold text-gray-900">{previewCampaign.subject}</div>
              </div>

              {/* Email Body */}
              <div className="bg-gray-50 rounded-xl p-6">
                {previewCampaign.headerImage && (
                  <img
                    src={previewCampaign.headerImage}
                    alt="Email header"
                    className="w-full h-48 object-cover rounded-lg mb-6"
                  />
                )}
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewCampaign.content }}
                />
              </div>

              {/* Email Footer Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(previewCampaign.status)}`}>
                      {previewCampaign.status || 'draft'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Recipients:</span>
                    <span className="ml-2 font-semibold text-gray-900">{previewCampaign.recipientCount || 0}</span>
                  </div>
                  {previewCampaign.sentCount > 0 && (
                    <>
                      <div>
                        <span className="text-gray-500">Sent:</span>
                        <span className="ml-2 font-semibold text-green-600">{previewCampaign.sentCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Failed:</span>
                        <span className="ml-2 font-semibold text-red-600">{previewCampaign.failedCount || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">Export Campaigns</h3>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportStartDate('');
                    setExportEndDate('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <p className="text-sm text-gray-500">
                Leave dates empty to export all campaigns
              </p>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportStartDate('');
                    setExportEndDate('');
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={exportToExcel}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl font-medium transition-all flex items-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailNewsletterManagement;
