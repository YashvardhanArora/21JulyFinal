import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { scaleLinear } from "d3-scale";
import type { Complaint } from "@shared/schema";

const STATUS_COLORS = {
  new: "#EF4444",
  "in-progress": "#F59E0B",
  resolved: "#10B981",
  closed: "#6B7280",
};

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ChartsProps {
  complaints?: Complaint[];
}

export function Charts({ complaints = [] }: ChartsProps) {
  // Calculate stats locally from the provided complaints data
  const stats = {
    total: complaints.length,
    new: complaints.filter(c => c.status === "new").length,
    inProgress: complaints.filter(c => c.status === "in-progress").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
    closed: complaints.filter(c => c.status === "closed").length,
  };

  const statusData = [
    { name: "New", value: stats.new, color: STATUS_COLORS.new },
    { name: "In Progress", value: stats.inProgress, color: STATUS_COLORS["in-progress"] },
    { name: "Resolved", value: stats.resolved, color: STATUS_COLORS.resolved },
    { name: "Closed", value: stats.closed, color: STATUS_COLORS.closed },
  ];

  // Regional data based on place of supply
  const regionalData = complaints.reduce((acc: any[], complaint) => {
    const region = complaint.placeOfSupply || 'Unknown';
    const existing = acc.find(item => item.name === region);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: region, value: 1 });
    }
    return acc;
  }, []);

  // Area of concern data (sorted from high to low)
  const areaOfConcernData = complaints.reduce((acc: any[], complaint) => {
    const area = complaint.areaOfConcern || 'Unknown';
    const existing = acc.find(item => item.name === area);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: area, value: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value); // Sort from high to low



  return (
    <div className="space-y-6">
      {/* Main Charts Row - Ticket Status and Regional Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Status */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Complaint Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={130}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Regional Complaints Heat Map */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Complaints by Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {regionalData.length > 0 ? (
                <div className="w-full h-full p-2">
                  {(() => {
                    // Get max value for color scale
                    const maxValue = Math.max(...regionalData.map(item => item.value));
                    
                    // Create color scale
                    const colorScale = scaleLinear<string>()
                      .domain([0, maxValue])
                      .range(['#E5F3FF', '#1E40AF']);

                    // State mapping for our regions
                    const stateMapping = {
                      'Mathura': 'UP',
                      'Agra': 'UP',
                      'Bhimasur': 'UP'
                    };

                    // Create heat map data for states
                    const heatMapData = regionalData.map(region => ({
                      id: stateMapping[region.name as keyof typeof stateMapping] || 'UP',
                      state: region.name,
                      value: region.value
                    }));

                    return (
                      <div className="space-y-4 relative">
                        {/* Leaflet India Map - Uttar Pradesh Focus */}
                        <div className="w-full h-64 rounded-lg border border-gray-300 overflow-hidden mb-6">
                          <div className="relative w-full h-full">
                            <MapContainer
                              center={[27.2, 78.0]} // Optimized center for Mathura-Agra-Bhimasur region
                              zoom={8}
                              style={{ height: '100%', width: '100%' }}
                              scrollWheelZoom={true}
                              zoomControl={true}
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              />
                                
                              {/* City Markers */}
                              {regionalData.map((region, index) => {
                                const positions = {
                                  'Mathura': [27.4924, 77.6833] as [number, number],
                                  'Agra': [27.1767, 78.0081] as [number, number],
                                  'Bhimasur': [27.3, 77.8] as [number, number]
                                };
                                
                                const colors = {
                                  'Mathura': '#DC2626',
                                  'Agra': '#059669',
                                  'Bhimasur': '#7C3AED'
                                };
                                
                                const position = positions[region.name as keyof typeof positions];
                                const color = colors[region.name as keyof typeof colors];
                                
                                if (!position) return null;
                                
                                // Create custom marker icon
                                const customIcon = L.divIcon({
                                  html: `
                                    <div style="
                                      background-color: ${color};
                                      border: 4px solid white;
                                      border-radius: 50%;
                                      width: ${30 + (region.value / maxValue) * 20}px;
                                      height: ${30 + (region.value / maxValue) * 20}px;
                                      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                                      display: flex;
                                      align-items: center;
                                      justify-content: center;
                                      color: white;
                                      font-weight: bold;
                                      font-size: 12px;
                                    ">
                                      ${region.value}
                                    </div>
                                  `,
                                  className: 'custom-marker',
                                  iconSize: [40, 40],
                                  iconAnchor: [20, 20]
                                });
                                
                                return (
                                  <Marker
                                    key={index}
                                    position={position}
                                    icon={customIcon}
                                  >
                                    <Popup>
                                      <div className="text-center p-2">
                                        <h3 className="font-bold text-lg" style={{ color: color }}>
                                          {region.name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                          <strong>{region.value}</strong> complaints
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {region.name === 'Mathura' ? 'High Priority Zone' :
                                           region.name === 'Agra' ? 'Medium Priority Zone' :
                                           'Active Monitoring Zone'}
                                        </p>
                                      </div>
                                    </Popup>
                                  </Marker>
                                );
                              })}
                                
                              {/* Circle overlays for better visibility */}
                              {regionalData.map((region, index) => {
                                const positions = {
                                  'Mathura': [27.4924, 77.6833] as [number, number],
                                  'Agra': [27.1767, 78.0081] as [number, number],
                                  'Bhimasur': [27.3, 77.8] as [number, number]
                                };
                                
                                const colors = {
                                  'Mathura': '#DC2626',
                                  'Agra': '#059669',
                                  'Bhimasur': '#7C3AED'
                                };
                                
                                const position = positions[region.name as keyof typeof positions];
                                const color = colors[region.name as keyof typeof colors];
                                
                                if (!position) return null;
                                
                                const radius = Math.max(8000, Math.min(25000, 8000 + (region.value / maxValue) * 15000));
                                
                                return (
                                  <Circle
                                    key={`circle-${index}`}
                                    center={position}
                                    radius={radius}
                                    pathOptions={{
                                      color: color,
                                      fillColor: color,
                                      fillOpacity: 0.1,
                                      weight: 2,
                                      opacity: 0.6
                                    }}
                                  />
                                );
                              })}
                            </MapContainer>
                            
                            {/* Regional Legend Overlay */}
                            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border max-w-xs z-20">
                              <h4 className="text-xs font-bold text-gray-800 mb-2">Regional Distribution</h4>
                              <div className="space-y-1">
                                {regionalData.map((region, index) => {
                                  const colors = {
                                    'Mathura': '#DC2626',
                                    'Agra': '#059669', 
                                    'Bhimasur': '#7C3AED'
                                  };
                                  const priority = {
                                    'Mathura': 'High Priority',
                                    'Agra': 'Medium Priority',
                                    'Bhimasur': 'Active Region'
                                  };
                                  
                                  return (
                                    <div key={index} className="flex items-center justify-between space-x-2">
                                      <div className="flex items-center space-x-1">
                                        <div 
                                          className="w-3 h-3 rounded-full shadow-sm"
                                          style={{ backgroundColor: colors[region.name as keyof typeof colors] }}
                                        />
                                        <span className="text-xs font-medium text-gray-800">{region.name}</span>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xs font-bold text-gray-900">{region.value}</div>
                                        <div className="text-xs text-gray-500">{priority[region.name as keyof typeof priority]}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {/* Summary stats */}
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <div className="text-sm font-bold text-blue-600">
                                      {regionalData.reduce((sum, region) => sum + region.value, 0)}
                                    </div>
                                    <div className="text-gray-600">Total</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-green-600">100%</div>
                                    <div className="text-gray-600">Coverage</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        
                        {/* Data Summary - Positioned below map with proper spacing */}
                        <div className="grid grid-cols-3 gap-3 mt-8 relative z-10">
                          {regionalData.map((region, index) => {
                            const regionColors = {
                              'Mathura': '#DC2626',
                              'Agra': '#059669',
                              'Bhimasur': '#7C3AED'
                            };
                            
                            return (
                              <div
                                key={index}
                                className="text-center p-2 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div 
                                  className="w-6 h-6 rounded-sm mx-auto mb-1 flex items-center justify-center text-white font-bold text-xs"
                                  style={{ backgroundColor: regionColors[region.name as keyof typeof regionColors] || colorScale(region.value) }}
                                >
                                  {region.value}
                                </div>
                                <div className="text-xs font-medium text-gray-900">{region.name}</div>
                                <div className="text-xs text-gray-500">complaints</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No regional data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}