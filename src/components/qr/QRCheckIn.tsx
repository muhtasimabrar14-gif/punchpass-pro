import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, Scan, CheckCircle, Users } from "lucide-react";
import { useClassCheckIns, useCheckInByQR } from "@/hooks/useCheckIns";
import { toast } from "@/hooks/use-toast";

interface QRCheckInProps {
  classId: string;
  className: string;
}

const QRCheckIn = ({ classId, className }: QRCheckInProps) => {
  const [qrCode, setQrCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  const { data: checkIns = [] } = useClassCheckIns(classId);
  const checkInByQR = useCheckInByQR();

  const handleCheckIn = async () => {
    if (!qrCode.trim()) {
      toast({
        title: "QR code required",
        description: "Please enter a QR code",
        variant: "destructive",
      });
      return;
    }

    try {
      await checkInByQR.mutateAsync(qrCode);
      toast({
        title: "Check-in successful!",
        description: "Student has been checked in",
      });
      setQrCode('');
      setIsScanning(false);
    } catch (error: any) {
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">QR Check-In</h2>
          <p className="text-muted-foreground">{className}</p>
        </div>
        
        <Dialog open={isScanning} onOpenChange={setIsScanning}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Scan className="h-4 w-4 mr-2" />
              Scan QR Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check In Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Scan student's QR code or enter manually below
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="qr-input">QR Code</Label>
                <Input
                  id="qr-input"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="QR_booking_id_here"
                  autoFocus
                />
              </div>
              
              <Button 
                onClick={handleCheckIn} 
                className="w-full"
                disabled={!qrCode.trim() || checkInByQR.isPending}
              >
                {checkInByQR.isPending ? 'Checking In...' : 'Check In'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Check-in Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkIns.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Check-ins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {checkIns.filter(checkIn => 
                new Date(checkIn.checked_in_at).getTime() > Date.now() - (30 * 60 * 1000)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 minutes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-in Rate</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {checkIns.length > 0 ? '100%' : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">Of total bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Check-ins List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {checkIns.length === 0 ? (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No check-ins yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkIns.slice(0, 10).map((checkIn: any) => (
                <div key={checkIn.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{checkIn.booking?.user_name}</p>
                      <p className="text-sm text-muted-foreground">{checkIn.booking?.user_email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(checkIn.checked_in_at).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(checkIn.checked_in_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCheckIn;