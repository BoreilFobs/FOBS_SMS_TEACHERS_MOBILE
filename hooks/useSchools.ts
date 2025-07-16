// hooks/useSchools.ts

import { useEffect, useState } from 'react';
import { TeacherSchoolResponse } from './types'; // adjust the import path
import {getUserAndTeacherData} from '@/utils/storage/getUserAndTeacher';

export const useSchools = (teacherId: number) => {
  const [schoolData, setSchoolData] = useState<TeacherSchoolResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  const fetchSchools = async () => {
    try {
      const { teacher } = await getUserAndTeacherData();
      if(teacher == null){
        return;
      }
      
      const response = await fetch(`${API_URL}/teacher-schools?teacher_id=${teacher.id}`, {
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
        setSchoolData(data.data);
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
