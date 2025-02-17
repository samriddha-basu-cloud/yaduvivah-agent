import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, CreditCard, Calendar, Award, UserPlus, ChevronUp } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Enhanced StatCard with hover and click animations
const StatCard = ({ title, value, icon: Icon, trend, description }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`bg-white p-6 rounded-xl shadow-lg transition-all duration-300 
        ${isHovered ? 'transform -translate-y-1 shadow-xl' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg transition-colors duration-300 
            ${isHovered ? 'bg-orange-600' : 'bg-orange-50'}`}>
            <Icon className={`h-6 w-6 transition-colors duration-300 
              ${isHovered ? 'text-white' : 'text-orange-600'}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <ChevronUp className={`h-4 w-4 transform transition-transform 
              ${trend >= 0 ? 'rotate-0' : 'rotate-180'}`} />
            <span className="text-sm font-semibold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
};

// Enhanced ChartCard with animations
const ChartCard = ({ title, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`bg-white p-6 rounded-xl shadow-lg transition-opacity duration-500 
      ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-6">{title}</h3>
      <div className="w-full h-72">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
};

const Stats = ({ agentData }) => {
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toLocaleString('default', { month: 'long' });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const revenueTrend = ((agentData.lastMonthRevenue - agentData.previousMonthRevenue) / 
    agentData.previousMonthRevenue * 100).toFixed(1);

  const userTrend = ((agentData.activeUsers - agentData.lastMonthActiveUsers) / 
    agentData.lastMonthActiveUsers * 100).toFixed(1);

  const revenueData = [
    { name: 'Jan', revenue: 2500000 },
    { name: 'Feb', revenue: 3200000 },
    { name: 'Mar', revenue: 2800000 },
    { name: 'Apr', revenue: 3800000 },
    { name: 'May', revenue: 4200000 },
    { name: 'Jun', revenue: 3900000 }
  ];

  const userDistributionData = [
    { name: 'Premium Users', value: agentData.premiumUsers },
    { name: 'Regular Users', value: agentData.totalUsers - agentData.premiumUsers }
  ];

  const matchesData = [
    { name: 'Jan', matches: 45 },
    { name: 'Feb', matches: 52 },
    { name: 'Mar', matches: 48 },
    { name: 'Apr', matches: 70 },
    { name: 'May', matches: 65 },
    { name: 'Jun', matches: 85 }
  ];

  const COLORS = ['#4F46E5', '#818CF8'];
  const [selectedPieIndex, setSelectedPieIndex] = useState(null);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8 bg-gray-50">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={agentData.totalUsers?.toLocaleString() || 0}
          icon={Users}
          trend={userTrend}
          description="Total profiles created"
        />
        <StatCard
          title="Active Users"
          value={agentData.activeUsers?.toLocaleString() || 0}
          icon={UserPlus}
          description="Currently active profiles"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(agentData.lastMonthRevenue || 0)}
          icon={CreditCard}
          trend={revenueTrend}
          description={`Revenue for ${lastMonth}`}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(agentData.totalRevenue || 0)}
          icon={TrendingUp}
          description="Total earnings till date"
        />
        <StatCard
          title="Successful Matches"
          value={agentData.successfulMatches?.toLocaleString() || 0}
          icon={Award}
          description="Total successful marriages"
        />
        <StatCard
          title="Premium Users"
          value={agentData.premiumUsers?.toLocaleString() || 0}
          icon={Calendar}
          description="Active premium subscriptions"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Trend">
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              tickFormatter={(value) => `₹${value / 100000}L`}
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ 
                backgroundColor: '#F9FAFB',
                border: 'none',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#4F46E5" 
              strokeWidth={3}
              dot={{ stroke: '#4F46E5', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#4F46E5', strokeWidth: 2 }}
            />
          </LineChart>
        </ChartCard>

        <ChartCard title="Monthly Matches">
          <BarChart data={matchesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#F9FAFB',
                border: 'none',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="matches" 
              fill="#4F46E5"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartCard>

        {/* <ChartCard title="User Distribution">
          <PieChart>
            <Pie
              data={userDistributionData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              onMouseEnter={(_, index) => setSelectedPieIndex(index)}
              onMouseLeave={() => setSelectedPieIndex(null)}
            >
              {userDistributionData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  opacity={selectedPieIndex === null || selectedPieIndex === index ? 1 : 0.6}
                  className="transition-opacity duration-300"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#F9FAFB',
                border: 'none',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
          </PieChart>
        </ChartCard> */}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-lg bg-orange-50">
            <p className="text-sm text-gray-600 mb-2">Conversion Rate</p>
            <p className="text-3xl font-bold text-orange-600">
              {((agentData.premiumUsers / agentData.totalUsers) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-orange-50">
            <p className="text-sm text-gray-600 mb-2">Success Rate</p>
            <p className="text-3xl font-bold text-orange-600">
              {((agentData.successfulMatches / agentData.totalUsers) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-orange-50">
            <p className="text-sm text-gray-600 mb-2">Average Revenue Per User</p>
            <p className="text-3xl font-bold text-orange-600">
              {formatCurrency(agentData.totalRevenue / agentData.totalUsers)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;