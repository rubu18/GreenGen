
import { Calendar, Clock, User, MapPin, ArrowRight, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AdminEventManager from "@/components/AdminEventManager";
import { checkUserIsAdmin } from "@/utils/adminUtils";

type CollectionEvent = {
  id: string;
  title: string;
  location: string;
  date: string;
  time_range: string;
  participants: number;
  waste_small: number;
  waste_medium: number;
  waste_large: number;
  status: string;
};

const CollectWaste = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CollectionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const isUserAdmin = await checkUserIsAdmin(user.id);
      setIsAdmin(isUserAdmin);
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    fetchEvents();
    
    // Set up real-time listener for collection_events changes
    const channel = supabase
      .channel('public:collection_events')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'collection_events' 
      }, () => {
        fetchEvents();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeFilter]); // Add activeFilter as dependency to refetch when filter changes

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Use a simple query to avoid type issues
      let query = supabase
        .from("collection_events")
        .select("*")
        .order("date", { ascending: true });
      
      // Apply filter if set
      if (activeFilter) {
        query = query.eq("status", activeFilter);
      }
      
      const { data, error } = await query;
      
      if (!error) {
        setEvents(data || []);
      } else {
        console.error("Error fetching events:", error);
      }
    } catch (err) {
      console.error("Exception fetching events:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleJoinEvent = (eventId: string) => {
    // This would typically update the participants count or create a participant record
    // For now we'll just show a toast message
    alert("Feature to join event will be implemented in future updates!");
  };

  const getFilteredEvents = () => {
    if (!activeFilter) return events;
    return events.filter(event => event.status === activeFilter);
  };

  const filteredEvents = getFilteredEvents();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Collect Waste</h1>
        <p className="text-gray-600 mb-8">
          Join waste collection events or collect reported waste to earn rewards.
        </p>
        
        {/* Admin event manager */}
        {isAdmin && (
          <AdminEventManager />
        )}

        {/* Map Section */}
        <div className="mb-8">
          <div className="bg-gray-200 rounded-lg h-[300px] w-full flex items-center justify-center">
            <p className="text-gray-500">Interactive map will be displayed here</p>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button 
            variant={activeFilter === null ? "default" : "outline"}
            className={activeFilter === null ? "bg-eco hover:bg-eco-dark" : ""}
            onClick={() => setActiveFilter(null)}
          >
            All Events
          </Button>
          <Button 
            variant={activeFilter === "active" ? "default" : "outline"}
            className={activeFilter === "active" ? "bg-eco hover:bg-eco-dark" : ""}
            onClick={() => setActiveFilter("active")}
          >
            Active Events
          </Button>
          <Button 
            variant={activeFilter === "completed" ? "default" : "outline"}
            className={activeFilter === "completed" ? "bg-eco hover:bg-eco-dark" : ""}
            onClick={() => setActiveFilter("completed")}
          >
            Completed Events
          </Button>
          <Button 
            variant={activeFilter === "cancelled" ? "default" : "outline"}
            className={activeFilter === "cancelled" ? "bg-eco hover:bg-eco-dark" : ""}
            onClick={() => setActiveFilter("cancelled")}
          >
            Cancelled Events
          </Button>
        </div>
        
        {/* Collection Points */}
        <h2 className="text-2xl font-semibold mb-4">
          {activeFilter ? `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Collection Events` : "All Collection Events"}
        </h2>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-600">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No {activeFilter ? activeFilter : ""} events found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {filteredEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {event.location}
                      </CardDescription>
                    </div>
                    <Badge 
                      className={
                        event.status === "active" 
                          ? "bg-eco hover:bg-eco-dark" 
                          : event.status === "completed"
                          ? "bg-gray-500" 
                          : "bg-red-500"
                      }
                    >
                      {event.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{event.date}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{event.time_range}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{event.participants} participants</span>
                    </div>
                    
                    <div className="pt-3">
                      <h4 className="text-sm font-medium mb-2">Reported Waste:</h4>
                      <div className="flex space-x-4">
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-full bg-eco-light flex items-center justify-center mx-auto mb-1">
                            <span className="text-xs font-medium text-eco-dark">{event.waste_small}</span>
                          </div>
                          <p className="text-xs text-gray-500">Small</p>
                        </div>
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-full bg-eco-light flex items-center justify-center mx-auto mb-1">
                            <span className="text-xs font-medium text-eco-dark">{event.waste_medium}</span>
                          </div>
                          <p className="text-xs text-gray-500">Medium</p>
                        </div>
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-full bg-eco-light flex items-center justify-center mx-auto mb-1">
                            <span className="text-xs font-medium text-eco-dark">{event.waste_large}</span>
                          </div>
                          <p className="text-xs text-gray-500">Large</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  {event.status === "active" ? (
                    <Button 
                      className="w-full bg-eco hover:bg-eco-dark"
                      onClick={() => handleJoinEvent(event.id)}
                    >
                      Join Event <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      disabled={true}
                    >
                      {event.status === "completed" ? "Event Completed" : "Event Cancelled"}
                    </Button>
                  )}
                  
                  {isAdmin && (
                    <div className="flex gap-2 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-eco text-eco hover:bg-eco-light hover:text-eco-dark"
                        onClick={() => window.location.href = "/admin"}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Individual Reports */}
        <h2 className="text-2xl font-semibold mb-4">Recent Waste Reports</h2>
        <div className="bg-eco-light rounded-lg p-6 text-center">
          <p className="text-gray-700 mb-4">
            Currently, there are no individual waste reports available for collection in your area.
          </p>
          <Button variant="outline" className="border-eco text-eco hover:bg-eco-light hover:text-eco-dark">
            Expand Search Area
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default CollectWaste;
