'use client'

import { IEvent } from '@/lib/database/models/event.model'
import { formatBilingualDateTime } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { DeleteConfirmation } from './DeleteConfirmation'
import { CustomField } from '@/types'
import { cn } from '@/lib/utils'
import { getCategoryColor } from '@/lib/utils/colorUtils'
import { Card as ShadcnCard, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from 'lucide-react'

// Legacy category colors for backward compatibility
export const categoryColors: { [key: string]: string } = {
  'All': 'bg-gray-200 text-gray-700',
  '念佛超荐法会': 'bg-blue-200 text-blue-700',
  '念佛共修': 'bg-orange-200 text-orange-700',
  '外出结缘法会': 'bg-green-200 text-green-700',
};

interface CardProps {
  event: IEvent & {
    orderId?: string;
    customFieldValues?: CustomField[];
    queueNumber?: string;
    registrationCount?: number;
  };
  hasOrderLink?: boolean;
  isMyTicket?: boolean;
  userId?: string;
  priority?: boolean;
}

const Card = ({ event, hasOrderLink, isMyTicket, userId, priority = false }: CardProps) => {
  const router = useRouter();
  const isEventCreator = userId === event.organizer._id.toString();
  const [imageLoading, setImageLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageUrlRef = useRef(event.imageUrl);
  
  // Use dynamic color assignment with fallback to legacy colors
  const categoryColor = event.category.color 
    ? event.category.color 
    : categoryColors[event.category.name] || getCategoryColor(event.category.name);
    
  // Safely extract background and text colors
  const colorParts = categoryColor.split(' ');
  const bgColor = colorParts[0] || 'bg-gray-200';
  const textColor = colorParts[1] || 'text-gray-700';
    
  const isExpired = new Date(event.endDateTime) < new Date();

  useEffect(() => {
    if (imageUrlRef.current !== event.imageUrl) {
      imageUrlRef.current = event.imageUrl;
      setImageError(false);
      setImageLoading(true);
    }
  }, [event.imageUrl]);

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    const href = isMyTicket ? `/reg/${event.orderId}` : `/events/details/${event._id}`;
    router.push(href);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleRetryImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageError(false);
    setImageLoading(true);
  };

  return (
    <ShadcnCard 
      className={cn(
        "group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg focus-within:ring-2 focus-within:ring-primary md:min-h-[438px]",
        isNavigating && "pointer-events-none opacity-70",
        isExpired && "opacity-75"
      )}
      role="article"
      aria-labelledby={`event-title-${event._id}`}
    >
      <Link
        href={isMyTicket ? `/reg/${event.orderId}` : `/events/details/${event._id}`}
        className="relative aspect-square w-full bg-muted overflow-hidden"
        onClick={handleCardClick}
      >
        {event.imageUrl && event.imageUrl.trim() !== '' && !imageError ? (
          <Image 
            src={event.imageUrl} 
            alt={event.title}
            fill
            className={cn(
              "object-cover transition-opacity duration-300",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoadingComplete={handleImageLoad}
            onError={handleImageError}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-muted-foreground bg-muted w-full h-full border-2 border-dashed border-border">
            <div className="flex flex-col items-center gap-2 max-w-[200px] text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <Image src="/assets/icons/image.svg" alt="placeholder" width={32} height={32} />
              </div>
              <p className="text-sm font-medium">
                {imageError ? (
                  <span className="text-destructive">Failed to load image</span>
                ) : !event.imageUrl || event.imageUrl.trim() === '' ? (
                  "No image available"
                ) : (
                  "Loading image..."
                )}
              </p>
              {imageError && (
                <button 
                  onClick={handleRetryImage}
                  className="mt-1 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded-sm px-2 py-1"
                >
                  Retry loading
                </button>
              )}
            </div>
          </div>
        )}
        {imageLoading && event.imageUrl && event.imageUrl.trim() !== '' && !imageError && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
      </Link>

      {isEventCreator && (
        <div className="absolute right-2 top-2 flex flex-col gap-2 rounded-xl bg-background/80 backdrop-blur-sm p-2 shadow-sm">
          <Link
            href={`/events/details/${event._id}/update`}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Image src="/assets/icons/edit.svg" alt="edit" width={20} height={20} />
          </Link>

          <DeleteConfirmation eventId={event._id} />
        </div>
      )}

      <CardHeader className="flex flex-col gap-2 p-5 pb-0">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={cn("rounded-full font-medium", bgColor, textColor)}>
            {event.category.name}
          </Badge>
          {isExpired && (
            <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
              已过期 / Expired
            </Badge>
          )}
        </div>
        
        <time 
          dateTime={new Date(event.startDateTime).toISOString()}
          className="text-sm font-medium text-muted-foreground"
        >
          {formatBilingualDateTime(event.startDateTime).combined.dateOnly} | {formatBilingualDateTime(event.startDateTime).cn.timeOnly} - {formatBilingualDateTime(event.endDateTime).cn.timeOnly}
        </time>

        <Link
          href={`/events/details/${event._id}`}
          className="hover:underline focus:outline-none"
          onClick={handleCardClick}
        >
          <CardTitle 
            id={`event-title-${event._id}`}
            className="text-lg md:text-xl line-clamp-2 transition-colors hover:text-primary"
          >
            {event.title}
          </CardTitle>
        </Link>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-5 pt-3 flex-1">
        {isMyTicket && (
          <div className="flex flex-col gap-2 bg-muted/50 p-3 rounded-md">
            <p className="text-sm">
              <span className="font-semibold text-foreground">排队号码 Queue Number:</span> {event.queueNumber || 'N/A'}
            </p>
            {event.customFieldValues?.map((field) => (
              <p key={field.id} className="text-sm">
                <span className="font-semibold text-foreground">{field.label}:</span> {field.value}
              </p>
            ))}
          </div>
        )}

        {isEventCreator && (
          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex justify-between items-center py-2 border-t border-border">
              <span className="text-sm font-medium text-muted-foreground">报名人数 Registrations:</span>
              <Badge variant="outline" className="font-bold">{event.registrationCount || 0}</Badge>
            </div>
            <Link 
              href={`/reg?eventId=${event._id}`} 
              className="text-primary hover:underline text-sm font-medium flex items-center gap-1 mt-1"
            >
              报名详情 Registration Details
              <Image 
                src="/assets/icons/arrow.svg" 
                alt="" 
                width={10} 
                height={10} 
                className="ml-1"
              />
            </Link>
          </div>
        )}
      </CardContent>

      {isNavigating && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      )}
    </ShadcnCard>
  )
}

export default Card