import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface School {
  id: number;
  name: string;
  code: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'pending' | 'inactive';
  academic_year?: string;
  pivot?: {
    is_approved: boolean;
    created_at: string;
  };
}

interface SchoolStoreState {
  // Current active school (Facebook-style)
  activeSchool: School | null;
  
  // All schools the teacher has access to
  schools: School[];
  
  // Recently switched schools (for quick access)
  recentSchools: School[];
  
  // Actions
  setActiveSchool: (school: School) => void;
  setSchools: (schools: School[]) => void;
  addSchool: (school: School) => void;
  removeSchool: (schoolId: number) => void;
  clearSchools: () => void;
  
  // Get active school ID (convenience method)
  getActiveSchoolId: () => number | null;
}

const useSchoolStore = create<SchoolStoreState>()(
  persist(
    (set, get) => ({
      activeSchool: null,
      schools: [],
      recentSchools: [],

      setActiveSchool: (school) => {
        const currentRecent = get().recentSchools;
        // Add to recent, keep max 3, avoid duplicates
        const filteredRecent = currentRecent.filter(s => s.id !== school.id);
        const newRecent = [school, ...filteredRecent].slice(0, 3);
        
        set({ 
          activeSchool: school,
          recentSchools: newRecent
        });
      },

      setSchools: (schools) => {
        const current = get();
        // If no active school and we have schools, set the first active one
        if (!current.activeSchool && schools.length > 0) {
          const firstActive = schools.find(s => s.status === 'active' && s.pivot?.is_approved);
          if (firstActive) {
            set({ 
              schools, 
              activeSchool: firstActive,
              recentSchools: [firstActive]
            });
            return;
          }
        }
        set({ schools });
      },

      addSchool: (school) => {
        set((state) => ({
          schools: [...state.schools, school]
        }));
      },

      removeSchool: (schoolId) => {
        set((state) => {
          const newSchools = state.schools.filter(s => s.id !== schoolId);
          const newRecent = state.recentSchools.filter(s => s.id !== schoolId);
          
          // If we removed the active school, switch to another
          let newActive = state.activeSchool;
          if (state.activeSchool?.id === schoolId) {
            newActive = newSchools.find(s => s.status === 'active') || null;
          }
          
          return {
            schools: newSchools,
            recentSchools: newRecent,
            activeSchool: newActive
          };
        });
      },

      clearSchools: () => {
        set({
          activeSchool: null,
          schools: [],
          recentSchools: []
        });
      },

      getActiveSchoolId: () => {
        return get().activeSchool?.id || null;
      }
    }),
    {
      name: 'school-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeSchool: state.activeSchool,
        recentSchools: state.recentSchools,
      }),
    }
  )
);

export default useSchoolStore;
