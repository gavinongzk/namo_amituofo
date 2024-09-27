import React from 'react';
import { render, screen } from '@testing-library/react';
import RegistrationCard from '../shared/RegistrationCard';
import '@testing-library/jest-dom';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('RegistrationCard', () => {
  const mockEvent = {
    _id: '1',
    title: 'Test Event',
    imageUrl: 'https://example.com/image.jpg',
    organizer: { _id: 'org1' },
    orderId: 'order1',
  };

  const mockRegistrations = [
    { queueNumber: 'A001', name: 'John Doe' },
    { queueNumber: 'A002', name: 'Jane Smith' },
  ];

  it('renders event title', () => {
    render(<RegistrationCard event={mockEvent} registrations={mockRegistrations} />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  it('renders all registrations', () => {
    render(<RegistrationCard event={mockEvent} registrations={mockRegistrations} />);
    expect(screen.getByText('A001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('A002')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders view order details button with correct link', () => {
    render(<RegistrationCard event={mockEvent} registrations={mockRegistrations} />);
    const button = screen.getByRole('link', { name: /view order details/i });
    expect(button).toHaveAttribute('href', '/orders/order1');
  });

  it('applies background image style', () => {
    render(<RegistrationCard event={mockEvent} registrations={mockRegistrations} />);
    const imageContainer = screen.getByRole('link', { name: '' });
    expect(imageContainer).toHaveStyle(`background-image: url(${mockEvent.imageUrl})`);
  });

  it('renders correctly when no registrations are provided', () => {
    render(<RegistrationCard event={mockEvent} registrations={[]} />);
    expect(screen.queryByText('Queue Number:')).not.toBeInTheDocument();
    expect(screen.queryByText('Name:')).not.toBeInTheDocument();
  });
});
