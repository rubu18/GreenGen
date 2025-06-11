
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Shield, Info, Users, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { ADMIN_EMAIL } from '@/constants/auth';
import { createUtilsToast } from '@/lib/utils';
import AdminEventManager from '@/components/AdminEventManager';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type WasteReport = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  waste_size: string;
  image_url: string | null;
  status: string;
  created_at: string;
  user_id: string;
};

const AdminDashboard = () => {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [currentView, setCurrentView] = useState<'reports' | 'events'>('reports');
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkAdminAccess = async () => {
      setIsCheckingAdmin(true);
      
      if (!user) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }
      
      try {
        // Direct email match check (primary method)
        if (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          console.log("Admin access granted by email match");
          setIsAdmin(true);
          
          // Also ensure they're in the admin_users table
          try {
            const { error } = await supabase
              .from('admin_users')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (error) {
              // If table doesn't exist or user not found, add them
              try {
                await supabase
                  .from('admin_users')
                  .upsert({ user_id: user.id })
                  .select();
                  
                console.log("Added user to admin_users table");
              } catch (err) {
                console.log("Could not add to admin_users table, but continuing with admin access");
              }
            }
          } catch (err) {
            console.log("Error checking admin_users table, but continuing with admin access");
          }
          
          setIsCheckingAdmin(false);
          return;
        }
        
        // Fallback: Check admin_users table
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        setIsAdmin(!!adminData);
      } catch (err) {
        console.error("Error checking admin status:", err);
        // If all checks fail but email matches admin email, grant access anyway
        if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } finally {
        setIsCheckingAdmin(false);
      }
    };
    
    checkAdminAccess();
  }, [user]);
  
  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('waste_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        createUtilsToast.error("Failed to load reports", error.message);
      } else {
        setReports(data || []);
      }
    } catch (err) {
      console.error("Exception fetching reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('waste_reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) {
        console.error('Error updating report:', error);
        createUtilsToast.error("Failed to update report", error.message);
        return;
      }

      createUtilsToast.success("Report status updated");
      setReports(reports.map(report => 
        report.id === reportId ? { ...report, status: newStatus } : report
      ));
      
      // Close dialog if open
      if (reportDialogOpen && selectedReport?.id === reportId) {
        setSelectedReport(null);
        setReportDialogOpen(false);
      }
    } catch (err) {
      console.error("Exception updating report:", err);
    }
  };

  const viewReportDetails = (report: WasteReport) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  if (isCheckingAdmin) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-eco"></div>
            <span className="ml-3">Checking admin permissions...</span>
          </div>
        </div>
      </Layout>
    );
  }

  // Special override for admin email users
  if (!isAdmin && user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return (
      <Layout>
        <div className="p-6">
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Email Matched But Admin Status Not Confirmed</AlertTitle>
            <AlertDescription>
              <p>Your email matches the admin email, but your admin status couldn't be confirmed in the database.</p>
              <Button 
                className="mt-4 bg-eco hover:bg-eco-dark"
                onClick={() => {
                  setIsAdmin(true);
                  createUtilsToast.success("Admin access granted based on email match");
                }}
              >
                Override and Access Admin Panel
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              <p>You do not have admin privileges. Only admin users can access this dashboard.</p>
              <p className="mt-2">Please use the admin email to log in: <strong>{ADMIN_EMAIL}</strong></p>
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-eco" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Admin Access Confirmed</AlertTitle>
          <AlertDescription>
            You have successfully accessed the admin dashboard with admin privileges.
          </AlertDescription>
        </Alert>
        
        {/* Tab Navigation */}
        <div className="flex mb-6 border-b">
          <button
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 ${
              currentView === 'reports' ? 'border-b-2 border-eco text-eco' : 'text-gray-600'
            }`}
            onClick={() => setCurrentView('reports')}
          >
            <ClipboardList size={16} />
            Waste Reports
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 ${
              currentView === 'events' ? 'border-b-2 border-eco text-eco' : 'text-gray-600'
            }`}
            onClick={() => setCurrentView('events')}
          >
            <Users size={16} />
            Collection Events
          </button>
        </div>
        
        {currentView === 'reports' ? (
          <Card>
            <CardHeader>
              <CardTitle>Waste Reports Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-eco"></div>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No waste reports found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id} className="cursor-pointer hover:bg-gray-50" onClick={() => viewReportDetails(report)}>
                          <TableCell>
                            {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>{report.title}</TableCell>
                          <TableCell>{report.location}</TableCell>
                          <TableCell>{report.waste_size}</TableCell>
                          <TableCell>
                            <Badge variant={
                              report.status === 'completed' ? 'default' :
                              report.status === 'in_progress' ? 'secondary' :
                              'destructive'
                            }>
                              {report.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <select
                              value={report.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateReportStatus(report.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="border rounded p-1 text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="approved">Approved</option>
                            </select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <AdminEventManager />
        )}
        
        {/* Report Details Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
              <DialogDescription>
                View complete details of the waste report.
              </DialogDescription>
            </DialogHeader>
            
            {selectedReport && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Title</h3>
                  <p>{selectedReport.title}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p>{selectedReport.description || 'No description provided'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p>{selectedReport.location}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Waste Size</h3>
                  <p>{selectedReport.waste_size}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <select
                    value={selectedReport.status}
                    onChange={(e) => updateReportStatus(selectedReport.id, e.target.value)}
                    className="mt-1 border rounded p-2 text-sm w-full"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                
                {selectedReport.image_url && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Image</h3>
                    <img 
                      src={selectedReport.image_url} 
                      alt="Waste report" 
                      className="mt-2 rounded border object-cover h-48 w-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        
      </div>
    </Layout>
  );
};

export default AdminDashboard;
