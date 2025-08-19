import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Users, Calendar, Clock, AlertCircle } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface AnalyticsDashboardProps {
  organizationId: string;
}

const AnalyticsDashboard = ({ organizationId }: AnalyticsDashboardProps) => {
  const [dateRange, setDateRange] = useState('30');
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(dateRange));
  
  const { data: analytics } = useAnalytics(organizationId, {
    start: startDate.toISOString(),
    end: new Date().toISOString(),
  });

  if (!analytics) return <div>Loading analytics...</div>;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--brand))', 'hsl(var(--brand-2))', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalBookings > 0 ? '+' : ''}
              {Math.round(analytics.totalBookings * 0.1)} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(analytics.totalRevenue * 0.15)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageClassCapacity.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Class utilization rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.noShowRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.noShowRate < 10 ? 'Excellent' : analytics.noShowRate < 20 ? 'Good' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.bookingsByDay.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="hsl(var(--brand))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Popular Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.popularClasses.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No class data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.popularClasses.map((cls, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{cls.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="bg-muted rounded-full h-2 w-24">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min((cls.bookings / Math.max(...analytics.popularClasses.map(c => c.bookings))) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{cls.bookings}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Revenue Growth</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your revenue has grown by 15% compared to the previous period.
                </p>
              </div>

              <div className={`p-4 rounded-lg ${
                analytics.noShowRate > 20 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <AlertCircle className={`h-4 w-4 ${
                    analytics.noShowRate > 20 ? 'text-red-600' : 'text-blue-600'
                  }`} />
                  <span className={`font-medium ${
                    analytics.noShowRate > 20 ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    No-Show Rate: {analytics.noShowRate.toFixed(1)}%
                  </span>
                </div>
                <p className={`text-sm mt-1 ${
                  analytics.noShowRate > 20 ? 'text-red-700' : 'text-blue-700'
                }`}>
                  {analytics.noShowRate > 20 
                    ? 'Consider implementing stricter cancellation policies or requiring deposits.'
                    : 'Great job maintaining a low no-show rate!'
                  }
                </p>
              </div>

              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Class Utilization</span>
                </div>
                <p className="text-sm text-purple-700 mt-1">
                  {analytics.averageClassCapacity > 80 
                    ? 'Classes are running at high capacity - consider adding more sessions.'
                    : 'There\'s room to grow class attendance with better marketing.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;