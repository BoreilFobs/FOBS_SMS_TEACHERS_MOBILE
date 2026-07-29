// hooks/useSchools.ts

import { useEffect, useState } from 'react';
import { SchoolResponse } from './types';
import { getUserAndTeacherData } from '@/utils/storage/getUserAndTeacher';
import Config from '@/constants/Config';
import { authFetch } from '@/services/authFetch';

export const useSchools = (teacherId?: number) => {
  const [schoolData, setSchoolData] = useState<SchoolResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchSchools = async () => {
    try {

      const { teacher } = await getUserAndTeacherData();
      if(teacher == null){
        return;
      }
      
      const response = await authFetch(`${Config.apiBaseUrl}/teacher-schools?teacher_id=${teacher.id}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('API Response:', response);
        throw new Error(`HTTP error! status: ${response.status}`);
        
      }

      const data = await response.json();
      console.log('API Response:', data.success);
      

      if (data.success) {
        setSchoolData(Array.isArray(data.data) ? data.data as SchoolResponse[] : []);
      } else {
        setError(data.message || 'Failed to fetch schools');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const refetch = () => {
    setLoading(true);
    setError(null);
    fetchSchools();
  };

  return { schoolData, loading, error, refetch };
};
