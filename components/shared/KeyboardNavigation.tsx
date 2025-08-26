'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

const KeyboardNavigation = () => {
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'super_admin';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'h':
            event.preventDefault();
            router.push('/');
            break;
          case 's':
            event.preventDefault();
            router.push('/event-lookup');
            break;
          case 'a':
            if (isSignedIn && isAdmin) {
              event.preventDefault();
              router.push('/admin/dashboard');
            }
            break;
          case 'u':
            if (isSignedIn && isAdmin) {
              event.preventDefault();
              router.push('/admin/users');
            }
            break;
          case 'd':
            if (isSignedIn && isAdmin) {
              event.preventDefault();
              router.push('/admin/analytics');
            }
            break;
          case 'c':
            if (isSignedIn && isAdmin) {
              event.preventDefault();
              router.push('/events/create');
            }
            break;
        }
      }

      // Function keys
      switch (event.key) {
        case 'F1':
          event.preventDefault();
          router.push('/faq');
          break;
        case 'F2':
          event.preventDefault();
          router.push('/event-lookup');
          break;
        case 'F3':
          if (isSignedIn && isAdmin) {
            event.preventDefault();
            router.push('/admin/dashboard');
          }
          break;
        case 'F4':
          if (isSignedIn && isAdmin) {
            event.preventDefault();
            router.push('/admin/users');
          }
          break;
      }

      // Escape key to go back
      if (event.key === 'Escape') {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push('/');
        }
      }
    };

    // Add keyboard shortcuts help tooltip
    const addKeyboardHelp = () => {
      const existingHelp = document.getElementById('keyboard-help');
      if (existingHelp) return;

      const helpDiv = document.createElement('div');
      helpDiv.id = 'keyboard-help';
      helpDiv.className = 'fixed bottom-4 left-4 bg-gray-900 text-white p-3 rounded-lg text-sm opacity-0 pointer-events-none transition-opacity duration-300 z-50';
      helpDiv.innerHTML = `
        <div class="font-semibold mb-2">键盘快捷键:</div>
        <div class="space-y-1 text-xs">
          <div>Ctrl+H: 首页</div>
          <div>Ctrl+S: 活动查询</div>
          <div>F1: 常见问题</div>
          <div>F2: 活动查询</div>
          <div>ESC: 返回</div>
          ${isSignedIn && isAdmin ? `
            <div class="border-t border-gray-700 pt-1 mt-2">
              <div>Ctrl+A: 管理员仪表板</div>
              <div>Ctrl+U: 用户管理</div>
              <div>Ctrl+D: 数据分析</div>
              <div>Ctrl+C: 创建活动</div>
              <div>F3: 管理员仪表板</div>
              <div>F4: 用户管理</div>
            </div>
          ` : ''}
        </div>
      `;
      document.body.appendChild(helpDiv);
    };

    // Show keyboard help on Ctrl+Shift+?
    const handleHelpKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === '?') {
        event.preventDefault();
        const helpDiv = document.getElementById('keyboard-help');
        if (helpDiv) {
          helpDiv.classList.toggle('opacity-100');
          helpDiv.classList.toggle('pointer-events-auto');
          
          // Hide after 5 seconds
          setTimeout(() => {
            helpDiv.classList.remove('opacity-100', 'pointer-events-auto');
          }, 5000);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleHelpKey);
    
    // Add help tooltip after component mounts
    setTimeout(addKeyboardHelp, 1000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleHelpKey);
      
      // Clean up help tooltip
      const helpDiv = document.getElementById('keyboard-help');
      if (helpDiv) {
        helpDiv.remove();
      }
    };
  }, [router, isSignedIn, isAdmin]);

  return null; // This component doesn't render anything
};

export default KeyboardNavigation;
