import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { MessageCircle, XCircle, User, Mail, Calendar, Filter, Search } from 'lucide-react'

const SupportManagement = () => {
  const { projectId } = useParams()
  const [supportChats, setSupportChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState(null)
  const [showChatModal, setShowChatModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filteredChats, setFilteredChats] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // Filter chats function
  const filterChats = useCallback(() => {
    if (searchTerm || statusFilter !== 'all') {
      let filtered = [...supportChats]

      if (searchTerm) {
        filtered = filtered.filter(chat =>
          chat.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chat.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chat.title?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(chat => chat.status === statusFilter)
      }

      setFilteredChats(filtered)
    } else {
      setFilteredChats(supportChats)
    }
  }, [searchTerm, statusFilter, supportChats])

  useEffect(() => {
    filterChats()
  }, [filterChats])

  // Load support chats
  useEffect(() => {
    if (!projectId) {
      console.error('No project ID available')
      setLoading(false)
      return
    }
    
    const supportChatsRef = collection(db, `projects/${projectId}/supportChats`)
    const q = query(supportChatsRef, orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          lastMessageAt: data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : data.lastMessageAt
        }
      })
      setSupportChats(chats)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [projectId])

  // Live-update selected chat while modal is open
  useEffect(() => {
    if (!showChatModal || !selectedChat?.id || !projectId) return

    const chatRef = doc(db, `projects/${projectId}/supportChats`, selectedChat.id)
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        // Convert Firestore timestamps to Date objects for proper display
        const processedData = {
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          lastMessageAt: data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : data.lastMessageAt,
          messages: data.messages?.map(msg => ({
            ...msg,
            timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp
          })) || []
        }
        setSelectedChat({ id: snapshot.id, ...processedData })
      }
    })

    return () => unsubscribe()
  }, [showChatModal, selectedChat?.id, projectId])

  // Handle chat selection
  const handleChatSelect = (chat) => {
    setSelectedChat(chat)
    setShowChatModal(true)
  }

  // Handle status update
  const handleStatusUpdate = async (chatId, newStatus) => {
    try {
      if (!projectId) {
        console.error('No project ID available')
        return
      }
      
      const chatRef = doc(db, `projects/${projectId}/supportChats`, chatId)
      await updateDoc(chatRef, {
        status: newStatus,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error updating chat status:', error)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    setSendingMessage(true)
    try {
      if (!projectId) {
        console.error('No project ID available')
        setSendingMessage(false)
        return
      }
      
      const chatRef = doc(db, `projects/${projectId}/supportChats`, selectedChat.id)
      const newMessageObj = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        senderId: 'admin',
        senderName: 'Support Team',
        senderType: 'admin',
        timestamp: new Date(),
        type: 'text'
      }
      
      // Get current messages and add new one
      const currentMessages = selectedChat.messages || []
      const updatedMessages = [...currentMessages, newMessageObj]
      
      await updateDoc(chatRef, {
        messages: updatedMessages,
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })

      // Update the selectedChat state to show the new message immediately
      setSelectedChat(prev => ({
        ...prev,
        messages: updatedMessages,
        lastMessageAt: new Date(),
        updatedAt: new Date()
      }))

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get priority badge color
  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    } catch (error) {
      console.error('Error formatting date:', error, timestamp)
      return 'Invalid Date'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Management</h2>
          <p className="text-gray-600">Manage customer support chats and inquiries</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Chats: {supportChats.length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by user name, email, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Support Chats Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredChats.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No support chats found
                  </td>
                </tr>
              ) : (
                filteredChats.map((chat) => (
                  <tr key={chat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {chat.userName || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {chat.userEmail || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{chat.title || 'Support Chat'}</div>
                      <div className="text-sm text-gray-500">{chat.category || 'General'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(chat.status)}`}>
                        {chat.status || 'Open'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(chat.priority)}`}>
                        {chat.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {chat.lastMessage || 'No messages yet'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(chat.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleChatSelect(chat)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Chat
                        </button>
                        <select
                          value={chat.status || 'open'}
                          onChange={(e) => handleStatusUpdate(chat.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && selectedChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedChat.title || 'Support Chat'}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedChat.userName} - {selectedChat.userEmail}
                </p>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50" ref={(el) => {
              if (el) {
                el.scrollTop = el.scrollHeight;
              }
            }}>
              <div className="space-y-4">
                {selectedChat.messages && selectedChat.messages.length > 0 ? (
                  selectedChat.messages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderType === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {message.senderName || (message.senderType === 'admin' ? 'Support Team' : 'User')}
                        </div>
                        <div className="text-sm">{message.text}</div>
                        <div className={`text-xs mt-1 ${
                          message.senderType === 'admin' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp ? formatDate(message.timestamp) : 'Just now'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation by sending a message</p>
                  </div>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupportManagement
