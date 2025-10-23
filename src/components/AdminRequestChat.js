import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft,
  Send,
  Download,
  DollarSign,
  Plus,
  X,
  CheckCircle,
  Clock,
  User,
  Receipt,
  Eye
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendStatusNotification } from '../services/statusNotificationService';

const AdminRequestChat = ({ 
  projectId, 
  requestId, 
  requestData, 
  onBack, 
  onStatusUpdate 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  
  // Debug invoice modal state changes
  useEffect(() => {
    console.log('Invoice modal state changed:', showInvoiceModal);
  }, [showInvoiceModal]);
  const [invoiceData, setInvoiceData] = useState({
    description: '',
    price: '',
    currency: 'EGP'
  });
  const [invoices, setInvoices] = useState([]);
  const [showInvoices, setShowInvoices] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages
  useEffect(() => {
    if (!projectId || !requestId) return;

    const messagesRef = collection(db, `projects/${projectId}/requestSubmissions/${requestId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
    }, (error) => {
      console.error('Error loading messages:', error);
      // If permission denied, show a message to the user
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for messages collection. Admin may need proper Firestore rules.');
      }
    });

    return () => unsubscribe();
  }, [projectId, requestId]);

  // Load invoices
  useEffect(() => {
    if (!projectId || !requestId) return;

    const invoicesRef = collection(db, `projects/${projectId}/requestSubmissions/${requestId}/invoices`);
    const q = query(invoicesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvoices(invoicesData);
    }, (error) => {
      console.error('Error loading invoices:', error);
      // If permission denied, show a message to the user
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for invoices collection. Admin may need proper Firestore rules.');
      }
    });

    return () => unsubscribe();
  }, [projectId, requestId]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !projectId || !requestId) return;

    try {
      setLoading(true);
      const messagesRef = collection(db, `projects/${projectId}/requestSubmissions/${requestId}/messages`);
      
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderType: 'admin',
        senderId: 'admin',
        senderName: 'Admin',
        createdAt: serverTimestamp()
      });

      // Send notification to user about new message
      if (requestData?.userId) {
        try {
          const requestName = requestData?.categoryName || 'your request';
          await sendStatusNotification(
            projectId,
            requestData.userId,
            'New Message from Admin',
            `You have a new message regarding your request for "${requestName}": ${newMessage.trim().substring(0, 100)}${newMessage.trim().length > 100 ? '...' : ''}`,
            'رسالة جديدة من الإدارة',
            `لديك رسالة جديدة بخصوص طلبك لـ "${requestName}": ${newMessage.trim().substring(0, 100)}${newMessage.trim().length > 100 ? '...' : ''}`,
            'alert'
          );
          console.log('Chat message notification sent');
        } catch (notifError) {
          console.warn('Failed to send chat notification:', notifError);
        }
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check Firestore security rules for admin access.');
      } else {
        alert('Failed to send message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create invoice
  const createInvoice = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!invoiceData.description.trim() || !invoiceData.price) return;

    try {
      setLoading(true);
      console.log('Creating invoice...', { projectId, requestId, invoiceData });
      
      const invoicesRef = collection(db, `projects/${projectId}/requestSubmissions/${requestId}/invoices`);
      
      const invoice = {
        description: invoiceData.description.trim(),
        price: parseFloat(invoiceData.price),
        currency: invoiceData.currency,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: 'admin'
      };

      console.log('Adding invoice to Firestore...', invoice);
      await addDoc(invoicesRef, invoice);
      console.log('Invoice created successfully');

      // Add system message about invoice creation
      const messagesRef = collection(db, `projects/${projectId}/requestSubmissions/${requestId}/messages`);
      await addDoc(messagesRef, {
        text: `📄 Invoice created: ${invoiceData.description} - ${invoiceData.price} ${invoiceData.currency}`,
        senderType: 'system',
        senderId: 'system',
        senderName: 'System',
        createdAt: serverTimestamp(),
        isInvoice: true
      });

      console.log('System message added');
      
      // Reset form and close modal
      setInvoiceData({ description: '', price: '', currency: 'EGP' });
      setShowInvoiceModal(false);
      console.log('Invoice modal closed');
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check Firestore security rules for admin access to invoices.');
      } else {
        alert('Failed to create invoice. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update request status
  const updateRequestStatus = async (status) => {
    try {
      const requestRef = doc(db, `projects/${projectId}/requestSubmissions`, requestId);
      await updateDoc(requestRef, {
        status: status,
        updatedAt: serverTimestamp()
      });

      // Add system message about status change
      const messagesRef = collection(db, `projects/${projectId}/requestSubmissions/${requestId}/messages`);
      await addDoc(messagesRef, {
        text: `Status updated to: ${status}`,
        senderType: 'system',
        senderId: 'system',
        senderName: 'System',
        createdAt: serverTimestamp()
      });

      // Send push notification to user
      if (requestData?.userId) {
        try {
          const requestName = requestData?.categoryName || 'your request';
          let title_en = 'Request Status Update';
          let title_ar = 'تحديث حالة الطلب';
          let body_en = '';
          let body_ar = '';
          
          switch (status) {
            case 'pending':
              body_en = `Your request for "${requestName}" is now pending review by our team.`;
              body_ar = `طلبك لـ "${requestName}" قيد المراجعة من قبل فريقنا.`;
              break;
            case 'in_progress':
              body_en = `Great news! Work has started on your request for "${requestName}". Our team is now processing your request.`;
              body_ar = `أخبار رائعة! بدأ العمل على طلبك لـ "${requestName}". فريقنا يعمل الآن على طلبك.`;
              break;
            case 'completed':
              body_en = `Your request for "${requestName}" has been completed! Thank you for using our services.`;
              body_ar = `تم إكمال طلبك لـ "${requestName}"! شكراً لاستخدام خدماتنا.`;
              break;
            case 'rejected':
              body_en = `Your request for "${requestName}" has been reviewed but cannot be approved at this time. Please contact the management office for more information.`;
              body_ar = `تمت مراجعة طلبك لـ "${requestName}" ولكن لا يمكن الموافقة عليه في هذا الوقت. يرجى الاتصال بمكتب الإدارة للحصول على مزيد من المعلومات.`;
              break;
            default:
              body_en = `Your request for "${requestName}" status has been updated to ${status.toUpperCase()}.`;
              body_ar = `تم تحديث حالة طلبك لـ "${requestName}" إلى ${status.toUpperCase()}.`;
          }
          
          await sendStatusNotification(projectId, requestData.userId, title_en, body_en, title_ar, body_ar, 'alert');
          console.log('Request status notification sent successfully');
        } catch (notificationError) {
          console.warn('Failed to send status notification:', notificationError);
          // Don't fail the status update if notification fails
        }
      }

      if (onStatusUpdate) {
        onStatusUpdate(requestId, status);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check Firestore security rules for admin access to request updates.');
      } else {
        alert('Failed to update status. Please try again.');
      }
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'in_progress':
        return Clock;
      case 'completed':
        return CheckCircle;
      case 'rejected':
        return X;
      default:
        return Clock;
    }
  };

  const StatusIcon = getStatusIcon(requestData?.status);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal"
      onClick={(e) => {
        console.log('Main modal clicked, closing...');
        onBack();
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {requestData?.categoryName || 'Request Chat'}
                </h2>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {requestData?.userName || 'Unknown User'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="h-4 w-4 text-gray-400" />
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(requestData?.status)}`}>
                      {requestData?.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowInvoices(!showInvoices)}
                className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <Receipt className="h-4 w-4 mr-1" />
                Invoices ({invoices.length})
              </button>
              
              {requestData?.status === 'pending' && (
                <button
                  onClick={() => updateRequestStatus('in_progress')}
                  className="px-3 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Start Processing
                </button>
              )}
              
              {requestData?.status === 'in_progress' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateRequestStatus('completed')}
                    className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => updateRequestStatus('rejected')}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
              
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderType === 'admin'
                        ? 'bg-blue-600 text-white'
                        : message.senderType === 'system'
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium opacity-75">
                        {message.senderName}
                      </span>
                      <span className="text-xs opacity-75">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">{message.text}</p>
                    {message.isInvoice && (
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <div className="flex items-center text-xs">
                          <Receipt className="h-3 w-3 mr-1" />
                          Invoice Notification
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                  title="Create Invoice"
                >
                  <DollarSign className="h-5 w-5" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || loading}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Invoices Sidebar */}
          {showInvoices && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
                  <button
                    onClick={() => setShowInvoices(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </button>
                
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {invoice.description}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {invoice.price} {invoice.currency}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(invoice.createdAt)}
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <button className="text-xs text-blue-600 hover:text-blue-800">
                          <Eye className="h-3 w-3 inline mr-1" />
                          View
                        </button>
                        <button className="text-xs text-green-600 hover:text-green-800">
                          <Download className="h-3 w-3 inline mr-1" />
                          PDF
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {invoices.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No invoices created yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Creation Modal */}
      {showInvoiceModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 finesModal"
          onClick={(e) => {
            console.log('Invoice modal backdrop clicked, closing...');
            e.stopPropagation();
            setShowInvoiceModal(false);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={createInvoice}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Create Invoice</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={invoiceData.description}
                    onChange={(e) => setInvoiceData({...invoiceData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter service description..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      value={invoiceData.price}
                      onChange={(e) => setInvoiceData({...invoiceData, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={invoiceData.currency}
                      onChange={(e) => setInvoiceData({...invoiceData, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="EGP">EGP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={(e) => {
                    console.log('Invoice modal cancel button clicked, closing...');
                    e.preventDefault();
                    e.stopPropagation();
                    setShowInvoiceModal(false);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!invoiceData.description.trim() || !invoiceData.price || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequestChat;
