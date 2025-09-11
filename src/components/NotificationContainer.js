import React from 'react';
import { useUINotificationStore } from '../stores/uiNotificationStore';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useUINotificationStore();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            bg-white rounded-lg shadow-lg border-l-4 p-4 
            transform transition-all duration-300 ease-in-out
            hover:scale-105 hover:shadow-xl
            pointer-events-auto cursor-pointer
            ${getBorderColor(notification.type)}
          `}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {notification.message}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-gray-400 h-1 rounded-full transition-all ease-linear"
              style={{
                width: '100%',
                animation: `shrink ${notification.duration}ms linear forwards`
              }}
            />
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default NotificationContainer;
