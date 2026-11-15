import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { mockNearbyCenters } from "../lib/mock-data";
import { MapPin, Star, Phone, Navigation, Wrench } from "lucide-react";

export function ShopsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nearby Service Centers</h1>
        <p className="text-muted-foreground">Find trusted repair shops and parts stores near you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockNearbyCenters.map((center) => (
          <Card key={center.id} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground">{center.name}</p>
                  <p className="text-xs text-muted-foreground">{center.type}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    center.openNow
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                  }
                >
                  {center.openNow ? "Open Now" : "Closed"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {center.distance}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-400" /> {center.rating} ({center.reviews} reviews)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {center.services.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                >
                  <Wrench className="h-4 w-4 mr-1.5" />
                  Request Service
                </Button>
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}