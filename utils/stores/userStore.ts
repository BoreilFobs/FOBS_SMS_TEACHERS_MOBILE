import { create } from 'zustand';
import {getUserAndTeacherData, clearUserAndTeacherData} from '@/utils/storage/getUserAndTeacher';

interface User {
  id: string;
  name: string;
  email: string;
  // other user properties
}

interface Teacher {
  id: string;
  user_id: string;
  qualifications: string;
  specialization: string;
  experience: string;
  phone: string;
  address: string;
  bio: string;
  profile_photo: string | null;
  // other teacher properties
}

interface UserStoreState {
  user: User | null;
  teacher: Teacher | null;
  setUser: (user: User) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  setTeacher: (teacher: Teacher) => void;
  updateTeacher: (updatedTeacher: Partial<Teacher>) => void;
  loadUserData: () => Promise<void>;
  clearUserData: () => Promise<void>;
}

const useUserStore = create<UserStoreState>((set) => ({
  user: null,
  teacher: null,

  setUser: (user) => set({ user }),
  updateUser: (updatedUser) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedUser } : null,
    })),
  setTeacher: (teacher) => set({ teacher }),
  
  // New method to update teacher data
  updateTeacher: (updatedTeacher) => 
    set((state) => ({
      teacher: state.teacher ? { ...state.teacher, ...updatedTeacher } : null
    })),

  loadUserData: async () => {
    const { user, teacher } = await getUserAndTeacherData();
    set({ user, teacher });
  },

  clearUserData: async () => {
    await clearUserAndTeacherData();
    set({ user: null, teacher: null });
  }
}));

export default useUserStore;
