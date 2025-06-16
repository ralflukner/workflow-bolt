import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../config/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { dailySessionService } from '../services/firebase/dailySessionService';
import { Database, RefreshCw, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { debugDateFormats } from '../utils/dateDebug';

export const FirebaseDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({
    firebaseConfigured: false,
    todayId: '',
    collectionExists: false,
    documentCount: 0,
    todayDocExists: false,
    todayDocData: null,
    lastError: null,
    loading: true
  });

  const loadDebugInfo = async () => {
    setDebugInfo(prev => ({ ...prev, loading: true }));
    
    try {
      const firebaseConfigured = isFirebaseConfigured();
      const todayId = new Date().toISOString().split('T')[0];
      
      if (!firebaseConfigured || !db) {
        setDebugInfo({
          firebaseConfigured,
          todayId,
          collectionExists: false,
          documentCount: 0,
          todayDocExists: false,
          todayDocData: null,
          lastError: 'Firebase not configured',
          loading: false
        });
        return;
      }

      // Check collection
      const collectionRef = collection(db, 'daily_sessions');
      const snapshot = await getDocs(collectionRef);
      const documentCount = snapshot.size;
      
      // Check today's document
      const todayRef = doc(db, 'daily_sessions', todayId);
      const todayDoc = await getDoc(todayRef);
      const todayDocExists = todayDoc.exists();
      let todayDocData = null;
      
      if (todayDocExists) {
        const data = todayDoc.data();
        todayDocData = {
          id: data?.id,
          date: data?.date,
          patientCount: data?.patients?.length || 0,
          createdAt: data?.createdAt?.toDate?.()?.toISOString() || 'N/A',
          updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || 'N/A',
          version: data?.version || 0
        };
      }

      setDebugInfo({
        firebaseConfigured,
        todayId,
        collectionExists: documentCount > 0,
        documentCount,
        todayDocExists,
        todayDocData,
        lastError: null,
        loading: false
      });
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      }));
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const testDirectSave = async () => {
    try {
      const testPatients = [
        {
          id: 'test-1',
          name: 'Test Patient 1',
          dob: '1990-01-01',
          appointmentTime: new Date().toISOString(),
          provider: 'Dr. Test',
          status: 'scheduled' as const
        },
        {
          id: 'test-2',
          name: 'Test Patient 2',
          dob: '1990-01-02',
          appointmentTime: new Date().toISOString(),
          provider: 'Dr. Test',
          status: 'arrived' as const,
          checkInTime: new Date().toISOString()
        }
      ];
      
      await dailySessionService.saveTodaysSession(testPatients);
      console.log('Test save completed');
      
      // Reload debug info
      await loadDebugInfo();
      
      // Try to load back
      const loaded = await dailySessionService.loadTodaysSession();
      console.log('Loaded patients:', loaded);
      
      alert(`Test save completed! Saved ${testPatients.length} patients, loaded back ${loaded.length} patients`);
    } catch (error) {
      console.error('Test save failed:', error);
      alert(`Test save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testDirectLoad = async () => {
    try {
      const patients = await dailySessionService.loadTodaysSession();
      console.log('Direct load result:', patients);
      alert(`Direct load found ${patients.length} patients`);
    } catch (error) {
      console.error('Direct load failed:', error);
      alert(`Direct load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Database className="mr-2" size={20} />
        Firebase Debugger
      </h3>
      
      <div className="space-y-3">
        {/* Configuration Status */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-medium text-white mb-2">Configuration</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Firebase Configured:</span>
              <span className={debugInfo.firebaseConfigured ? 'text-green-400' : 'text-red-400'}>
                {debugInfo.firebaseConfigured ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Today's ID:</span>
              <span className="text-blue-400">{debugInfo.todayId}</span>
            </div>
          </div>
        </div>

        {/* Collection Status */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-medium text-white mb-2">Collection Status</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Collection Exists:</span>
              <span className={debugInfo.collectionExists ? 'text-green-400' : 'text-yellow-400'}>
                {debugInfo.collectionExists ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Total Documents:</span>
              <span className="text-blue-400">{debugInfo.documentCount}</span>
            </div>
          </div>
        </div>

        {/* Today's Document */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-medium text-white mb-2">Today's Document</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Document Exists:</span>
              <span className={debugInfo.todayDocExists ? 'text-green-400' : 'text-red-400'}>
                {debugInfo.todayDocExists ? 'Yes' : 'No'}
              </span>
            </div>
            {debugInfo.todayDocData && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-300">Patient Count:</span>
                  <span className="text-blue-400">{debugInfo.todayDocData.patientCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Version:</span>
                  <span className="text-blue-400">{debugInfo.todayDocData.version}</span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  <div>Created: {debugInfo.todayDocData.createdAt}</div>
                  <div>Updated: {debugInfo.todayDocData.updatedAt}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {debugInfo.lastError && (
          <div className="bg-red-900/20 border border-red-600 p-3 rounded">
            <div className="flex items-center text-red-400">
              <AlertCircle size={16} className="mr-2" />
              <span className="text-sm">{debugInfo.lastError}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={loadDebugInfo}
            disabled={debugInfo.loading}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 disabled:opacity-50"
          >
            <RefreshCw size={14} className={`mr-1 ${debugInfo.loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={testDirectSave}
            disabled={!debugInfo.firebaseConfigured}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-500 disabled:opacity-50"
          >
            Test Direct Save
          </button>
          <button
            onClick={testDirectLoad}
            disabled={!debugInfo.firebaseConfigured}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-500 disabled:opacity-50"
          >
            Test Direct Load
          </button>
          <button
            onClick={() => {
              const dateInfo = debugDateFormats();
              alert(`Date Debug:\nCurrent Key: ${dateInfo.currentDateKey}\nTimezone: ${dateInfo.timezone}\nOffset: ${dateInfo.offset} minutes`);
            }}
            className="flex items-center px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-500"
          >
            <Calendar size={14} className="mr-1" />
            Debug Dates
          </button>
        </div>
      </div>
    </div>
  );
};