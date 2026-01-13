import { formatBilingualDateTime } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { IRegistration } from '@/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

type Props = {
  event: IRegistration['event'] & {
    orderId?: string
    queueNumber?: string
  }
  registrations: (IRegistration['registrations'][0] & {
    orderId?: string
  })[]
}

const RegistrationCard = ({ event, registrations }: Props) => {
  const primaryOrderId = event.orderId;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const imageUrlRef = useRef(event.imageUrl);

  // Reset image state only when imageUrl actually changes
  useEffect(() => {
    if (imageUrlRef.current !== event.imageUrl) {
      imageUrlRef.current = event.imageUrl;
      setImageError(false);
      setImageLoading(true);
    }
  }, [event.imageUrl]);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error(`Failed to load image: ${event.imageUrl}`);
    setImageLoading(false);
    setImageError(true);
  };

  // Sort registrations by queue number
  const sortedRegistrations = [...registrations].sort((a, b) => {
    // Handle cases where queue numbers might be missing or invalid
    const queueA = a.queueNumber ? parseInt(a.queueNumber.toString()) : 999999;
    const queueB = b.queueNumber ? parseInt(b.queueNumber.toString()) : 999999;
    
    // If both are invalid numbers, maintain original order
    if (isNaN(queueA) && isNaN(queueB)) return 0;
    if (isNaN(queueA)) return 1; // Move invalid numbers to end
    if (isNaN(queueB)) return -1; // Move invalid numbers to end
    
    return queueA - queueB;
  });

  return (
    <Card className="group relative flex min-h-[320px] w-full max-w-[400px] flex-col overflow-hidden transition-all hover:shadow-lg md:min-h-[380px]">
      <Link 
        href={`/reg/${primaryOrderId}`}
        className="relative aspect-square w-full bg-muted overflow-hidden"
      >
        {event.imageUrl && !imageError ? (
          <>
            <Image 
              src={event.imageUrl} 
              alt={event.title}
              fill
              className={`object-cover transition-opacity duration-300 ${
                imageLoading ? "opacity-0" : "opacity-100"
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoadingComplete={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
            {imageLoading && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-muted-foreground bg-muted w-full h-full border-2 border-dashed border-border">
            <div className="flex flex-col items-center gap-2 max-w-[200px] text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <Image src="/assets/icons/image.svg" alt="placeholder" width={32} height={32} />
              </div>
              <p className="text-sm font-medium">
                {imageError ? (
                  <span className="text-destructive">Failed to load image</span>
                ) : (
                  "No image available"
                )}
              </p>
            </div>
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-grow p-4 md:p-6">
        <CardHeader className="p-0 mb-4">
          <Link href={`/reg/${primaryOrderId}`} className="hover:underline">
            <CardTitle className="text-lg md:text-xl line-clamp-2 group-hover:text-primary transition-colors">
              {event.title}
            </CardTitle>
          </Link>
          {event.startDateTime && (
            <p className="text-sm text-muted-foreground mt-1">
              {formatBilingualDateTime(new Date(event.startDateTime)).combined.dateOnly} | {formatBilingualDateTime(new Date(event.startDateTime)).cn.timeOnly} - {formatBilingualDateTime(new Date(event.endDateTime as Date)).cn.timeOnly}
            </p>
          )}
        </CardHeader>

        <CardContent className="p-0 flex flex-col gap-3 flex-grow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              已报名参加者 Registered Participants
            </span>
            <Badge variant="secondary" className="font-bold">
              {sortedRegistrations.length}
            </Badge>
          </div>
          
          <ScrollArea className="h-[150px] w-full rounded-md border p-2 bg-muted/30">
            {sortedRegistrations.length > 0 ? (
              <div className="space-y-2">
                {sortedRegistrations.map((registration, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between bg-background p-2 rounded-sm border border-border shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium">{registration.name || 'N/A'}</span>
                    </div>
                    {registration.queueNumber && (
                      <Badge variant="secondary" className="text-[10px]">
                        #{registration.queueNumber}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                暂无参加者 No participants yet
              </div>
            )}
          </ScrollArea>
        </CardContent>

        <CardFooter className="p-0 mt-4">
          <Link 
            href={`/reg/${primaryOrderId}`} 
            className="text-sm text-primary hover:underline flex items-center gap-1 group/link"
          >
            查看报名记录 View Registration Details
            <Image 
              src="/assets/icons/arrow.svg" 
              alt="" 
              width={10} 
              height={10} 
              className="transition-transform group-hover/link:translate-x-1"
            />
          </Link>
        </CardFooter>
      </div>
    </Card>
  );
};

export default RegistrationCard