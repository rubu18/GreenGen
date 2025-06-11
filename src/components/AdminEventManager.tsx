
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { createUtilsToast } from "@/lib/utils";
import { checkUserIsAdmin, addUserToAdminTable } from "@/utils/adminUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

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

const emptyEvent: Partial<CollectionEvent> = {
  title: "",
  location: "",
  date: "",
  time_range: "",
  participants: 0,
  waste_small: 0,
  waste_medium: 0,
  waste_large: 0,
  status: "active",
};

export default function AdminEventManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CollectionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<CollectionEvent>>(emptyEvent);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchEvents();
    }
    // eslint-disable-next-line
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      console.log("Checking admin status for user:", user.id);
      const isUserAdmin = await checkUserIsAdmin(user.id);
      console.log("Is user admin:", isUserAdmin);
      setIsAdmin(isUserAdmin);
      
      if (!isUserAdmin) {
        setError("You don't have admin privileges to manage events. Please contact an administrator.");
      } else {
        setError(null);
        // If user is admin, ensure they're in the admin_users table
        await addUserToAdminTable(user.id);
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError("Error checking admin status. Please try again.");
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("collection_events")
        .select("*")
        .order("date", { ascending: true });
        
      if (error) {
        console.error("Error fetching events:", error);
        toast("Error fetching events", { description: error.message });
        setEvents([]);
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      console.error("Exception fetching events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyEvent);
    setEditingId(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        ["participants", "waste_small", "waste_medium", "waste_large"].includes(
          name
        )
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    if (
      !form.title ||
      !form.location ||
      !form.date ||
      !form.time_range ||
      !form.status
    ) {
      toast("Please fill all required fields.");
      setSubmitting(false);
      return;
    }

    try {
      if (!isAdmin && user) {
        // Try to add the current user as admin first
        const adminAdded = await addUserToAdminTable(user.id);
        if (adminAdded) {
          setIsAdmin(true);
        }
      }

      if (editingId) {
        // Update existing event - use explicit column names to avoid ambiguity
        const { error } = await supabase
          .from("collection_events")
          .update({
            title: form.title,
            location: form.location,
            date: form.date,
            time_range: form.time_range,
            status: form.status,
            participants: form.participants || 0,
            waste_small: form.waste_small || 0,
            waste_medium: form.waste_medium || 0,
            waste_large: form.waste_large || 0
          })
          .eq("id", editingId);

        if (error) {
          console.error("Error updating event:", error);
          setError(`Error updating event: ${error.message}`);
          createUtilsToast.error("Error updating event", error.message);
        } else {
          createUtilsToast.success("Event updated");
          resetForm();
          fetchEvents();
        }
      } else {
        // Create new event - explicitly specify each column to avoid ambiguous column references
        const { error } = await supabase
          .from("collection_events")
          .insert([{
            title: form.title,
            location: form.location,
            date: form.date,
            time_range: form.time_range,
            status: form.status,
            participants: form.participants || 0,
            waste_small: form.waste_small || 0,
            waste_medium: form.waste_medium || 0,
            waste_large: form.waste_large || 0
          }]);
        
        if (error) {
          console.error("Error creating event:", error);
          setError(`Error creating event: ${error.message}`);
          
          if (error.message.includes("row-level security policy")) {
            setError("You don't have permission to create events. Please ensure you have admin privileges.");
          } else if (error.message.includes("ambiguous")) {
            setError("Database column reference issue. Please contact the system administrator.");
          }
          
          createUtilsToast.error("Error creating event", error.message);
        } else {
          createUtilsToast.success("Event created");
          resetForm();
          fetchEvents();
        }
      }
    } catch (err: any) {
      console.error("Exception during event operation:", err);
      setError(`An unexpected error occurred: ${err.message}`);
      createUtilsToast.error("An error occurred", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (event: CollectionEvent) => {
    setEditingId(event.id);
    setForm({
      ...event,
      date: event.date.slice(0, 10),
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this event?")) return;
    const { error } = await supabase.from("collection_events").delete().eq("id", id);
    if (error) {
      createUtilsToast.error("Error deleting event", error.message);
    } else {
      createUtilsToast.success("Event deleted");
      fetchEvents();
    }
  };

  if (isAdmin === false) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Collection Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have admin permissions to manage events. Please contact an administrator.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/collect")} className="mt-4">
            Go to Collection Events
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Manage Collection Events</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end" onSubmit={handleSubmit}>
          <div>
            <Input
              name="title"
              value={form.title || ""}
              onChange={handleInputChange}
              placeholder="Event Title"
              required
            />
          </div>
          <div>
            <Input
              name="location"
              value={form.location || ""}
              onChange={handleInputChange}
              placeholder="Location"
              required
            />
          </div>
          <div>
            <Input
              name="date"
              type="date"
              value={form.date || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Input
              name="time_range"
              value={form.time_range || ""}
              onChange={handleInputChange}
              placeholder="Time Range (e.g. 9:00 AM - 12:00 PM)"
              required
            />
          </div>
          <div>
            <Input
              name="participants"
              type="number"
              value={form.participants || 0}
              onChange={handleInputChange}
              placeholder="Participants"
              min={0}
            />
          </div>
          <div>
            <Input
              name="waste_small"
              type="number"
              value={form.waste_small || 0}
              onChange={handleInputChange}
              placeholder="Small Waste"
              min={0}
            />
          </div>
          <div>
            <Input
              name="waste_medium"
              type="number"
              value={form.waste_medium || 0}
              onChange={handleInputChange}
              placeholder="Medium Waste"
              min={0}
            />
          </div>
          <div>
            <Input
              name="waste_large"
              type="number"
              value={form.waste_large || 0}
              onChange={handleInputChange}
              placeholder="Large Waste"
              min={0}
            />
          </div>
          <div>
            <select
              name="status"
              value={form.status || "active"}
              onChange={handleInputChange}
              className="bg-white border rounded px-3 py-2 w-full"
              required
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <Button
              type="submit"
              className="w-full bg-eco hover:bg-eco-dark flex gap-2 items-center"
              disabled={submitting}
            >
              {editingId ? (
                <>
                  <Edit className="h-4 w-4 mr-1" /> Update
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </>
              )}
            </Button>
          </div>
          {editingId && (
            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-red-500 text-red-500"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          )}
        </form>

        {loading ? (
          <div className="text-center py-6">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-6 text-gray-500">No events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded bg-white">
              <thead>
                <tr>
                  <th className="p-2">Title</th>
                  <th className="p-2">Location</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Waste: S/M/L</th>
                  <th className="p-2">Participants</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t">
                    <td className="p-2">{event.title}</td>
                    <td className="p-2">{event.location}</td>
                    <td className="p-2">{event.date}</td>
                    <td className="p-2">{event.time_range}</td>
                    <td className="p-2">
                      <Badge variant={event.status === "active" ? "default" : event.status === "completed" ? "secondary" : "destructive"}>
                        {event.status}
                      </Badge>
                    </td>
                    <td className="p-2">{event.waste_small} / {event.waste_medium} / {event.waste_large}</td>
                    <td className="p-2">{event.participants}</td>
                    <td className="p-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-eco text-eco hover:bg-eco-light hover:text-eco-dark"
                        onClick={() => handleEdit(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-100"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
