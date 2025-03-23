'use client';

import React, { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FAQFormData {
  question: string;
  answer: string;
  category?: string;
  isVisible: boolean;
}

const AdminFAQManagementPage = () => {
  const { user, isLoaded } = useUser();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState<FAQFormData>({
    question: '',
    answer: '',
    category: '',
    isVisible: true,
  });

  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata.role as string;
      setIsSuperAdmin(role === 'superadmin');
      if (role !== 'superadmin') {
        redirect('/');
      }
    }
  }, [isLoaded, user]);

  useEffect(() => {
    const fetchFAQs = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/faq-management');
        if (!res.ok) throw new Error('Failed to fetch FAQs');
        const data = await res.json();
        setFaqs(data);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        toast.error('Failed to load FAQs');
      } finally {
        setIsLoading(false);
      }
    };

    if (isSuperAdmin) {
      fetchFAQs();
    }
  }, [isSuperAdmin]);

  const handleCreateFAQ = async () => {
    try {
      const res = await fetch('/api/faq-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to create FAQ');

      const newFaq = await res.json();
      setFaqs([newFaq, ...faqs]);
      setShowCreateModal(false);
      resetForm();
      toast.success('FAQ created successfully');
    } catch (error) {
      console.error('Error creating FAQ:', error);
      toast.error('Failed to create FAQ');
    }
  };

  const handleUpdateFAQ = async () => {
    if (!selectedFaq) return;

    try {
      const res = await fetch(`/api/faq-management/${selectedFaq._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to update FAQ');

      const updatedFaq = await res.json();
      setFaqs(faqs.map(faq => faq._id === updatedFaq._id ? updatedFaq : faq));
      setShowEditModal(false);
      resetForm();
      toast.success('FAQ updated successfully');
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast.error('Failed to update FAQ');
    }
  };

  const handleDeleteFAQ = async () => {
    if (!selectedFaq) return;

    try {
      const res = await fetch(`/api/faq-management/${selectedFaq._id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete FAQ');

      setFaqs(faqs.filter(faq => faq._id !== selectedFaq._id));
      setShowDeleteModal(false);
      setSelectedFaq(null);
      toast.success('FAQ deleted successfully');
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ');
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: '',
      isVisible: true,
    });
    setSelectedFaq(null);
  };

  const handleEditClick = (faq: FAQ) => {
    setSelectedFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      isVisible: faq.isVisible,
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (faq: FAQ) => {
    setSelectedFaq(faq);
    setShowDeleteModal(true);
  };

  if (!isLoaded || !isSuperAdmin) {
    return (
      <div className="flex-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="wrapper my-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="h2-bold">FAQ Management</h1>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New FAQ
        </Button>
      </div>

      {isLoading ? (
        <div className="flex-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid gap-4">
          {faqs.map((faq) => (
            <Card key={faq._id} className="p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                  <p className="text-gray-600 whitespace-pre-line">{faq.answer}</p>
                  {faq.category && (
                    <p className="text-sm text-gray-500 mt-2">Category: {faq.category}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditClick(faq)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteClick(faq)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Switch
                  checked={faq.isVisible}
                  onCheckedChange={(checked: boolean) => {
                    handleUpdateFAQ();
                  }}
                />
                <Label>Visible</Label>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create FAQ Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New FAQ</DialogTitle>
            <DialogDescription>
              Add a new frequently asked question and its answer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Question</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the question"
              />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter the answer"
                rows={5}
              />
            </div>
            <div>
              <Label>Category (Optional)</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Enter a category"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isVisible}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, isVisible: checked })}
              />
              <Label>Visible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFAQ}>Create FAQ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit FAQ Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>
              Update the question and answer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Question</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the question"
              />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter the answer"
                rows={5}
              />
            </div>
            <div>
              <Label>Category (Optional)</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Enter a category"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isVisible}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, isVisible: checked })}
              />
              <Label>Visible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFAQ}>Update FAQ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete FAQ Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete FAQ</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFAQ}>
              Delete FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFAQManagementPage; 