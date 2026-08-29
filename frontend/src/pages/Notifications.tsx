import React, { useState, useEffect } from 'react';
import { Bell, Building2, Check, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';
import toast from 'react-hot-toast';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return new Date(date).toLocaleDateString();
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      // quiet fail
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'company_approval': return <Building2 className="w-5 h-5 text-indigo-500" />;
      case 'status_update': return <Info className="w-5 h-5 text-blue-500" />;
      case 'system': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
            <Check className="w-4 h-4 mr-2" /> Mark All as Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="You're all caught up!" />
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => (
            <div 
              key={notification._id}
              onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
              className={`p-4 rounded-xl border transition-colors ${
                notification.isRead 
                  ? 'bg-white border-gray-200' 
                  : 'bg-indigo-50/50 border-indigo-200 border-l-4 border-l-indigo-500 cursor-pointer'
              } flex gap-4`}
            >
              <div className="mt-1">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm ${notification.isRead ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>
                    {notification.title}
                  </h4>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {timeAgo(notification.createdAt)}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                  {notification.message}
                </p>
              </div>
              {!notification.isRead && (
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
