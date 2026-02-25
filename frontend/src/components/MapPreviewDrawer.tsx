import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  mapLink: string;
  donorName: string;
}

export default function MapPreviewDrawer({ open, onClose, mapLink, donorName }: Props) {
  // Try to create an embeddable URL from the share link
  // Google Maps share links can't be directly embedded in iframes due to X-Frame-Options
  // So we show a preview card with a link to open in Google Maps

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="flex items-start justify-between">
          <div>
            <DrawerTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Location: {donorName}
            </DrawerTitle>
            <DrawerDescription>View this donor's location on Google Maps</DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="mt-1">
              <X className="w-4 h-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Map embed attempt */}
          <div className="relative w-full rounded-xl overflow-hidden border bg-muted" style={{ height: '320px' }}>
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapLink)}&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map for ${donorName}`}
              className="w-full h-full"
            />
          </div>

          {/* Fallback open link */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              asChild
              className="flex-1"
              onClick={onClose}
            >
              <a href={mapLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Google Maps
              </a>
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              Close
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            If the map doesn't load, click "Open in Google Maps" to view the location directly.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
