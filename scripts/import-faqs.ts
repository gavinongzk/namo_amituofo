import { connectToDatabase } from '@/lib/database';
import { IFaq } from '@/lib/database/models/faq.model';
import mongoose from 'mongoose';
import { defaultFaqs } from './faq-data';

const importFaqs = async () => {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    // Get the FAQ model
    const FAQ = mongoose.model<IFaq>('FAQ');

    // Import default FAQs
    const existingFaqs = await FAQ.find({});
    const newFaqs = defaultFaqs.filter(defaultFaq => 
      !existingFaqs.some((existingFaq: IFaq) => 
        existingFaq.question === defaultFaq.question
      )
    );

    if (newFaqs.length > 0) {
      await FAQ.insertMany(newFaqs);
      console.log(`Imported ${newFaqs.length} new FAQs`);
    } else {
      console.log('No new FAQs to import');
    }

    console.log('FAQ import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error importing FAQs:', error);
    process.exit(1);
  }
};

importFaqs(); 