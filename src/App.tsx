import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FleetOverview } from './pages/FleetOverview';
import { DriversPage } from './pages/DriversPage';
import { DriverDetail } from './pages/DriverDetail';
import { VehiclesPage } from './pages/VehiclesPage';
import { VehicleDetail } from './pages/VehicleDetail';
import { AttributionPage } from './pages/AttributionPage';
import { MethodologyPage } from './pages/MethodologyPage';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const handleSelectEntity = (type: 'driver' | 'vehicle', id: string) => {
    if (type === 'driver') {
      setSelectedDriverId(id);
      setSelectedVehicleId(null);
      setActiveTab('drivers');
    } else {
      setSelectedVehicleId(id);
      setSelectedDriverId(null);
      setActiveTab('vehicles');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedDriverId(null);
    setSelectedVehicleId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header onSelectEntity={handleSelectEntity} />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Mobile Navigation Header Tabs */}
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-2 flex overflow-x-auto gap-2 fixed bottom-0 left-0 right-0 z-40">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'drivers', label: 'Drivers' },
            { id: 'vehicles', label: 'Vehicles' },
            { id: 'attribution', label: 'Attribution' },
            { id: 'methodology', label: 'Methodology' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === t.id ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <FleetOverview
              onSelectEntity={handleSelectEntity}
              onNavigate={handleTabChange}
            />
          )}

          {activeTab === 'drivers' && (
            selectedDriverId ? (
              <DriverDetail
                driverId={selectedDriverId}
                onBack={() => setSelectedDriverId(null)}
                onSelectVehicle={id => handleSelectEntity('vehicle', id)}
              />
            ) : (
              <DriversPage
                onSelectDriver={id => handleSelectEntity('driver', id)}
              />
            )
          )}

          {activeTab === 'vehicles' && (
            selectedVehicleId ? (
              <VehicleDetail
                vehicleId={selectedVehicleId}
                onBack={() => setSelectedVehicleId(null)}
                onSelectDriver={id => handleSelectEntity('driver', id)}
              />
            ) : (
              <VehiclesPage
                onSelectVehicle={id => handleSelectEntity('vehicle', id)}
              />
            )
          )}

          {activeTab === 'attribution' && (
            <AttributionPage
              onSelectDriver={id => handleSelectEntity('driver', id)}
              onSelectVehicle={id => handleSelectEntity('vehicle', id)}
            />
          )}

          {activeTab === 'methodology' && (
            <MethodologyPage />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
