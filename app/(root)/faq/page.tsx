'use client';

import { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  isVisible: boolean;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const res = await fetch('/api/faq-management?public=true');
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

    fetchFAQs();
  }, []);

  return (
    <div className="wrapper my-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary-600 mb-4">
            常见问题 / FAQ
          </h1>
          <p className="text-gray-600 text-lg">
            查询常见问题 / Find answers to commonly asked questions
          </p>
        </div>

        {/* FAQ Section */}
        <Card className="p-6 bg-white/50 backdrop-blur-sm shadow-xl rounded-xl">
          {isLoading ? (
            <div className="flex-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-6">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={faq._id} 
                  value={`item-${index}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
                >
                  <AccordionTrigger className="px-6 py-5 hover:bg-gray-50 text-left [&[data-state=open]]:bg-primary-50">
                    <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-5 bg-white">
                    <div className="prose prose-gray max-w-none">
                      <div className="text-gray-600 leading-relaxed">
                        <div className="whitespace-pre-line">{faq.answer}</div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </Card>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 space-y-2">
            <div>其他问题？请通过WhatsApp联系我们：</div>
            <div>Still have questions? Contact us via WhatsApp at{' '}
              <a 
                href="https://wa.me/6588184848" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary-600 hover:underline font-medium"
              >
                +65 8818 4848
              </a>
            </div>
          </p>
        </div>
      </div>
    </div>
  );
}
