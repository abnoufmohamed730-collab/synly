import { useState } from "react";
import { mockRequests, statusLabels, statusColors, urgencyLabels, urgencyColors } from "../lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Send, X, MapPin, Clock, Car, User, DollarSign, MessageSquare, Image as ImageIcon } from "lucide-react";

export function RequestsPage() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  const filteredRequests = mockRequests.filter((r) => selectedStatus === "all" || r.status === selectedStatus);

  const statusTabs = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending Offers" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const selectedRequestData = mockRequests.find((r) => r.id === selectedRequest);

  const handleSendOffer = () => {
    // Handle sending offer
    console.log("Sending offer", { offerPrice, offerMessage });
  };

  const handleDecline = () => {
    // Handle declining request
    console.log("Declining request");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Requests Management</h1>
        <p className="text-muted-foreground">Manage incoming breakdown and maintenance requests</p>
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          {filteredRequests.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No requests found</h3>
                <p className="text-muted-foreground">Try selecting a different status filter.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">{request.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.carModel} {request.carYear}
                        </p>
                      </div>
                      <Badge className={statusColors[request.status]} variant="outline">
                        {statusLabels[request.status]}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {request.issueDescription}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge variant="secondary" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {request.distance}
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(request.timestamp).toLocaleString()}
                      </Badge>
                      <Badge className={urgencyColors[request.urgency]} variant="outline">
                        {urgencyLabels[request.urgency]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedRequest(request.id)}
                      >
                        View Details
                      </Button>
                      {request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                            onClick={() => {
                              setSelectedRequest(request.id);
                              setOfferPrice(request.estimatedPrice?.toString() || "");
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Offer
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => console.log("Decline", request.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Detail Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRequestData && (
            <>
              <DialogHeader>
                <DialogTitle>Request Details</DialogTitle>
                <DialogDescription>
                  {selectedRequestData.id} - {selectedRequestData.userName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* User & Car Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p className="font-medium text-foreground">{selectedRequestData.userName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle</p>
                      <p className="font-medium text-foreground">
                        {selectedRequestData.carModel} {selectedRequestData.carYear}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Issue Description */}
                <div>
                  <h4 className="font-medium text-foreground mb-2">Issue Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedRequestData.issueDescription}</p>
                </div>

                {/* Photos */}
                {selectedRequestData.photos && selectedRequestData.photos.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Uploaded Photos</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedRequestData.photos.map((photo, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img src={photo} alt={`Request photo ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location & Urgency */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{selectedRequestData.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedRequestData.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <Badge className={urgencyColors[selectedRequestData.urgency]} variant="outline">
                    {urgencyLabels[selectedRequestData.urgency]}
                  </Badge>
                </div>

                {/* Offer Section */}
                {selectedRequestData.status === "pending" && (
                  <div className="border-t border-border pt-4 space-y-4">
                    <h4 className="font-medium text-foreground">Send Price Offer</h4>
                    <div className="space-y-2">
                      <Label htmlFor="offerPrice">Offer Price (EGP)</Label>
                      <Input
                        id="offerPrice"
                        type="number"
                        placeholder="Enter your offer amount"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="offerMessage">Offer Message</Label>
                      <Textarea
                        id="offerMessage"
                        placeholder="Describe your offer, services included..."
                        value={offerMessage}
                        onChange={(e) => setOfferMessage(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                        onClick={handleSendOffer}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Offer
                      </Button>
                      <Button variant="destructive" onClick={handleDecline}>
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                )}

                {/* Invoice Section */}
                {selectedRequestData.status === "completed" && (
                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium text-foreground mb-2">Final Invoice</h4>
                    <div className="rounded-lg bg-accent p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service</span>
                        <span className="text-foreground">{selectedRequestData.issueDescription}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Labor</span>
                        <span className="text-foreground">EGP {(selectedRequestData.offerPrice || 0) * 0.6}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Parts</span>
                        <span className="text-foreground">EGP {(selectedRequestData.offerPrice || 0) * 0.4}</span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between">
                        <span className="font-medium text-foreground">Total</span>
                        <span className="font-bold text-foreground">EGP {selectedRequestData.offerPrice}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}